"""Behavioral contract for independently implemented figure utilities."""
import contextlib
import io
import os
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import unittest
import warnings
from unittest.mock import patch

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "skills/piresearch/pi-research-figures/assets"))
import pi_figstyle as s
import numpy as np

OUTPUT = ROOT / ".validation/independent-figures/implementer"
OUTPUT.mkdir(parents=True, exist_ok=True)


class FigureContract(unittest.TestCase):
    def setUp(self):
        s.use_style()

    def tearDown(self):
        s.plt.close("all")

    def test_mean_and_invalid_observations(self):
        mean, lo, hi = s.mean_ci([[1, 2], [3, 4], [5, 6]])
        np.testing.assert_allclose(mean, [3, 4])
        np.testing.assert_allclose(hi - mean, np.array([2, 2]) / np.sqrt(3) * 4.303)
        np.testing.assert_allclose(mean - lo, hi - mean)
        with self.assertRaises(ValueError):
            s.mean_ci([[1, np.nan], [2, 3]])
        with self.assertRaises(ValueError):
            s.mean_ci([], confidence=.9)
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            mean, lo, hi = s.mean_ci([[7, 8]])
        self.assertTrue(caught)
        np.testing.assert_equal(lo, mean)
        np.testing.assert_equal(hi, mean)

    def test_welch_unequal_samples_and_constants(self):
        a, b = np.array([4., 6., 8.]), np.array([0., 2., 4., 6.])
        difference, lo, hi = s.diff_ci(a, b)
        va, vb = np.var(a, ddof=1) / 3, np.var(b, ddof=1) / 4
        df = (va + vb) ** 2 / (va ** 2 / 2 + vb ** 2 / 3)
        self.assertEqual(int(df), 4)
        self.assertAlmostEqual(float(difference), 3.)
        self.assertAlmostEqual(float(hi - difference), 2.776 * np.sqrt(va + vb))
        self.assertAlmostEqual(float(lo), float(2 * difference - hi))
        np.testing.assert_allclose(s.diff_ci([5, 5], [2, 2, 2]), [3, 3, 3])
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            np.testing.assert_allclose(s.diff_ci([5], [2, 4]), [2, 2, 2])
        self.assertTrue(caught)

    def test_welch_flattens_each_group_to_scalar(self):
        first = np.array([[1., 3.], [5., 7.]])
        second = np.array([[2., 4., 6.]])
        expected = s.diff_ci(first.ravel(), second.ravel())
        actual = s.diff_ci(first, second)
        self.assertTrue(all(np.ndim(value) == 0 for value in actual))
        np.testing.assert_allclose(actual, expected)

    def test_scaling_floor_fit_bootstrap_and_load(self):
        module = runpy.run_path(str(ROOT / "skills/piresearch/pi-research-figures/examples/scaling.py"))
        self.assertTrue("fit_power_law" in module, "scaling must preserve fit_power_law")
        fit = module["fit_power_law"]
        alpha = np.linspace(.02, 1.5, 800)[217]
        n = np.geomspace(1e2, 1e7, 15)
        loss = 1.7 + 35 * n ** -alpha
        np.testing.assert_allclose(fit(n, loss), [1.7, 35, alpha], rtol=1e-8)
        boundary_n = np.array([1., 4., 9., 16.])
        boundary_loss = np.array([3., .7, .2, .01])
        with self.assertRaisesRegex(ValueError, "no legal"):
            fit(boundary_n, boundary_loss, [.5])
        np.testing.assert_allclose(fit(n[:2], loss[:2], [alpha]), [1.7, 35, alpha], rtol=1e-8)
        low, high = module["bootstrap_alpha"](n, loss, draws=40, seed=17)
        self.assertLessEqual(low, alpha)
        self.assertGreaterEqual(high, alpha)
        with self.assertRaises(ValueError):
            module["bootstrap_alpha"](n[:2], loss[:2], draws=20)
        with self.assertRaises(ValueError):
            module["bootstrap_alpha"](n, np.ones_like(n), draws=20)
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp:
            path = Path(temp) / "scaling.csv"
            path.write_text("family,n_params,loss,fit\nB,100,3,0\nA,10,4,1\n", encoding="utf-8")
            parameters, losses, selected, families = module["load"](path)
            np.testing.assert_array_equal(parameters, [100., 10.])
            np.testing.assert_array_equal(losses, [3., 4.])
            np.testing.assert_array_equal(selected, [False, True])
            np.testing.assert_array_equal(families, ["B", "A"])

    def test_pareto_uses_all_original_runs_per_method(self):
        example = ROOT / "skills/piresearch/pi-research-figures/examples/pareto.py"
        previous = Path.cwd()
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp, contextlib.redirect_stdout(io.StringIO()):
            try:
                os.chdir(temp)
                Path("figs").mkdir()
                Path("figs/pareto.csv").write_text(
                    "method,setting,seed,kl,reward\nGRPO,s1,0,1,10\nGRPO,s1,1,3,2\nGRPO,s2,0,2,9\nGRPO,s2,1,4,12\nES,s1,0,2,3\n", encoding="utf-8")
                with patch.object(s, "save") as save:
                    module = runpy.run_path(str(example))
                    self.assertTrue("METHODS" in module, "Pareto method color/shape configuration is public")
                    self.assertEqual(module["METHODS"], {"GRPO": ("blue", "o"), "ES": ("red", "D")})
                    loaded = module["load"]("figs/pareto.csv")
                    np.testing.assert_array_equal(loaded["GRPO"][0], [1, 3, 2, 4])
                    np.testing.assert_array_equal(loaded["GRPO"][1], [10, 2, 9, 12])
                    self.assertEqual(loaded["GRPO"][2], 2)
                    module["main"]()
                ax = save.call_args.args[0].axes[0]
                self.assertEqual([len(group.get_offsets()) for group in ax.collections], [4, 1])
                np.testing.assert_allclose(ax.lines[0].get_xydata(), [[1, 10], [4, 12]])
                np.testing.assert_allclose(ax.lines[1].get_xydata(), [[2, 3]])
                self.assertEqual([line.get_marker() for line in ax.lines], ["o", "D"])
                self.assertEqual([line.get_color() for line in ax.lines], [s.PALETTE["blue"], s.PALETTE["red"]])
                module["main"].__globals__["METHODS"] = {"GRPO": ("green", "s"), "ES": ("purple", "^")}
                module["main"]()
                configured = save.call_args.args[0].axes[0]
                self.assertEqual([line.get_marker() for line in configured.lines], ["s", "^"])
                self.assertEqual([line.get_color() for line in configured.lines], [s.PALETTE["green"], s.PALETTE["purple"]])
            finally:
                os.chdir(previous)

    def test_template_loaders_preserve_alignment_order_and_missing_cells(self):
        examples = ROOT / "skills/piresearch/pi-research-figures/examples"
        modules = {name: runpy.run_path(str(examples / f"{name}.py")) for name in ("loss_curve", "sweep", "ablation", "benchmarks")}
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp:
            root = Path(temp)
            path = root / "loss.csv"
            path.write_text("variant,seed,step,value\nbaseline,0,0,0\nbaseline,0,1,1\nbaseline,0,2,2\nbaseline,0,3,3\nbaseline,1,0.5,5\nbaseline,1,1.5,15\nbaseline,1,2.5,25\n", encoding="utf-8")
            self.assertTrue("load" in modules["loss_curve"], "loss_curve load API missing")
            steps, runs = modules["loss_curve"]["load"](path)["baseline"]
            np.testing.assert_array_equal(steps, [1, 2])
            np.testing.assert_allclose(runs, [[1, 2], [10, 20]])
            path.write_text("variant,seed,step,value\na,0,0,0\na,1,2,1\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                modules["loss_curve"]["load"](path)
            path.write_text("variant,seed,step,value\na,0,0,0\na,0,1,1\na,1,0.5,1\na,1,0.7,2\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                modules["loss_curve"]["load"](path)
            path = root / "sweep.csv"
            path.write_text("lr,batch_size,loss\n0.01,16,2\n0.1,8,\n0.01,8,1\n", encoding="utf-8")
            rates, batches, matrix = modules["sweep"]["load"](path)
            self.assertEqual(rates, [.1, .01])
            self.assertEqual(batches, [8, 16])
            self.assertTrue(np.isnan(matrix[0]).all())
            np.testing.assert_array_equal(matrix[1], [1, 2])
            path.write_text("lr,batch_size,loss\n0.1,8,\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                modules["sweep"]["load"](path)
            self.assertEqual(modules["ablation"]["REFERENCE"], "baseline")
            self.assertEqual(modules["ablation"]["HIGHLIGHT"], "ours")
            path = root / "ablation.csv"
            path.write_text("variant,seed,value\nbaseline,0,1\nours,0,2\nours,1,4\n", encoding="utf-8")
            values = modules["ablation"]["load"](path)
            np.testing.assert_array_equal(values["ours"], [2, 4])
            self.assertTrue(all(len(item) == 2 for item in modules["benchmarks"]["METHODS"]))
            first_method = modules["benchmarks"]["METHODS"][0][0]
            first_benchmark = modules["benchmarks"]["BENCHMARKS"][0]
            path = root / "benchmarks.csv"
            path.write_text(f"benchmark,method,score\n{first_benchmark},{first_method},42.5\n", encoding="utf-8")
            self.assertEqual(modules["benchmarks"]["load"](path), {first_method: {first_benchmark: 42.5}})
            shades = modules["benchmarks"]["method_colors"]()
            self.assertEqual(shades[first_method], s.BASELINE)
            prior = [shades[name] for name, group in modules["benchmarks"]["METHODS"] if group == "prior"]
            ours = [shades[name] for name, group in modules["benchmarks"]["METHODS"] if group == "ours"]
            self.assertEqual(len(set(prior)), 3)
            self.assertEqual(len(set(ours)), 3)
            self.assertEqual(prior[-1].lower(), s.PALETTE["blue"].lower())
            self.assertEqual(ours[-1].lower(), s.PALETTE["red"].lower())

    def test_scaling_joint_fit_heldout_and_residual_panels(self):
        example = ROOT / "skills/piresearch/pi-research-figures/examples/scaling.py"
        alpha = np.linspace(.02, 1.5, 800)[217]
        n = np.geomspace(1e2, 1e7, 15)
        loss = 1.7 + 35 * n ** -alpha
        loss[-3:] *= 1.5
        previous = Path.cwd()
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp, contextlib.redirect_stdout(io.StringIO()):
            try:
                os.chdir(temp)
                Path("figs").mkdir()
                rows = [f"{'A' if i % 2 else 'B'},{parameters:.17g},{value:.17g},{int(i < 12)}" for i, (parameters, value) in enumerate(zip(n, loss))]
                Path("figs/scaling.csv").write_text("family,n_params,loss,fit\n" + "\n".join(rows) + "\n", encoding="utf-8")
                with patch.object(s, "save") as save:
                    runpy.run_path(str(example), run_name="__main__")
                fit, residual = save.call_args.args[0].axes
                self.assertEqual(len(fit.lines), 2)
                np.testing.assert_allclose(fit.lines[0].get_ydata(), 1.7 + 35 * fit.lines[0].get_xdata() ** -alpha, rtol=1e-8)
                self.assertEqual(fit.lines[1].get_linestyle(), "--")
                self.assertEqual(fit.lines[1].get_xdata()[-1], 1e11)
                self.assertTrue(fit.patches)
                heldout = [points for points in fit.collections if "held out" in points.get_label()]
                self.assertEqual(sum(len(points.get_offsets()) for points in heldout), 3)
                self.assertTrue(all(len(points.get_facecolors()) == 0 for points in heldout))
                self.assertEqual(residual.get_ylabel(), "Residual (%)")
                for points in residual.collections:
                    x, actual = np.asarray(points.get_offsets()).T
                    measured = np.interp(x, n, loss)
                    predicted = 1.7 + 35 * x ** -alpha
                    np.testing.assert_allclose(actual, 100 * (measured - predicted) / measured, atol=1e-8)
                self.assertGreater(max(abs(points.get_offsets()[:, 1]).max() for points in residual.collections), 10)
                self.assertTrue(any("bootstrap" in text.get_text() and "n=12" in text.get_text() for text in fit.texts))
            finally:
                os.chdir(previous)

    def test_pareto_all_directions_and_ties(self):
        x, y = np.array([1, 1, 2, 3, 3]), np.array([1, 2, 3, 2, 2])
        for minimum in (True, False):
            for maximum in (True, False):
                xx, yy = x * (1 if minimum else -1), y * (-1 if maximum else 1)
                expected = [i for i in range(len(x)) if not any(
                    xx[j] <= xx[i] and yy[j] <= yy[i] and
                    (xx[j] < xx[i] or yy[j] < yy[i] or j < i)
                    for j in range(len(x)) if j != i)]
                expected.sort(key=lambda i: xx[i])
                np.testing.assert_array_equal(s.pareto_front(x, y, minimum, maximum), expected)
        self.assertEqual(s.pareto_front([], []).dtype.kind, "i")

    def test_real_output_size_and_safe_paths(self):
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp:
            root = Path(temp)
            fig, ax = s.figure()
            ax.plot([0, 1], [0, 1]); ax.set(xlabel="Time (s)", ylabel="Value")
            with patch.dict(os.environ, {"PI_OUTPUT_DIR": str(root / "primary"), "OUTPUT_DIR": str(root / "other")}), s.matplotlib.rc_context({"savefig.bbox": "tight"}), contextlib.redirect_stderr(io.StringIO()) as messages:
                paths = s.save(fig, "figs/real", close=False)
                self.assertTrue(Path(paths[0]).read_bytes().startswith(b"%PDF"))
                self.assertIn("<svg", Path(paths[1]).read_text(encoding="utf-8"))
                svg = Path(paths[1]).read_text(encoding="utf-8")
                self.assertRegex(svg, r'width="234pt"')
                self.assertRegex(svg, r'height="159.12pt"')
                np.testing.assert_allclose(fig.get_size_inches(), [3.25, 3.25 * .68])
                self.assertTrue(messages.getvalue().strip())
                for unsafe in ("", ".", "a/./b", "a//b", "a/../b", "C:escape", "\\absolute", "bad\0name", "nested/name:stream", "folder:stream/name"):
                    with self.assertRaises(ValueError, msg=repr(unsafe)):
                        s.save(fig, unsafe)
                outside = root / "outside"; outside.mkdir()
                link = root / "primary/link"
                try:
                    link.symlink_to(outside, target_is_directory=True)
                except OSError as error:
                    if os.name != "nt":
                        raise
                    junction = subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(outside)], capture_output=True)
                    self.assertEqual(junction.returncode, 0, msg=f"symlink unavailable ({error}); junction also failed")
                    print("Symlink privilege unavailable; verified an actual Windows directory junction instead.")
                try:
                    with self.assertRaises(ValueError):
                        s.save(fig, "link/escape")
                    self.assertFalse((outside / "escape.pdf").exists())
                finally:
                    if link.is_symlink():
                        link.unlink()
                    else:
                        os.rmdir(link)
            self.assertFalse((root / "other").exists())

    def test_audit_detects_real_problems_and_ignores_hidden_ticks(self):
        fig, ax = s.figure()
        ax.plot([0, 1], [0, 1])
        ax.text(.5, .5, "tiny", fontsize=4)
        ax.text(.25, .7, "collision A"); ax.text(.25, .7, "collision B")
        problems = " ".join(map(str, s._audit(fig))).lower()
        self.assertIn("5", problems)
        self.assertIn("label", problems)
        self.assertTrue(s._text_collisions(fig))
        ax.set(xlabel="Time", ylabel="Value")
        ax.set_axis_off()
        self.assertNotIn("missing", " ".join(map(str, s._audit(fig))).lower())

    def test_direct_labels_on_linear_and_log_axes(self):
        for logarithmic in (False, True):
            fig, ax = s.figure()
            lines = [ax.plot([1, 2, 4], [v, v * 1.01, v * 1.02])[0] for v in (1, 1.001, 1.002)]
            if logarithmic:
                ax.set(xscale="log", yscale="log")
            s.label_ends(ax, lines, ["alpha method", "beta method", "gamma method"])
            fig.canvas.draw()
            boxes = [text.get_window_extent() for text in ax.texts]
            self.assertTrue(all(box.x1 <= ax.get_window_extent().x1 + .5 for box in boxes))
            for first, second in zip(sorted(boxes, key=lambda b: b.y0), sorted(boxes, key=lambda b: b.y0)[1:]):
                self.assertGreaterEqual(second.y0 - first.y1, 7 * fig.dpi / 72 - .5)
            self.assertGreater(ax.get_xlim()[1], 4)
        s.label_ends(ax, [], [])

    def test_matrix_nan_band_and_ticks(self):
        fig, ax = s.figure()
        values = np.array([[0, np.nan], [1, 2]])
        im = ax.imshow(values)
        s.annotate_matrix(ax, values, image=im)
        self.assertEqual(len(ax.texts), 3)
        self.assertEqual({t.get_color() for t in ax.texts}, {"white", "black"})
        fig, ax = s.figure()
        line = s.band(ax, [0, 1], [[1, 2], [3, 4]], color=s.PALETTE["blue"])
        np.testing.assert_allclose(line.get_ydata(), [2, 3])
        self.assertEqual(len(ax.collections), 1)
        s.si_ticks(ax)
        self.assertEqual(ax.xaxis.get_major_formatter()(1500, 0), "1.5k")

    def test_sizes_panel_labels_palette_and_shared_labels(self):
        fig, axes = s.figure_grid(1, 2, width=s.TEXT, ratio=.5, sharey=True)
        np.testing.assert_allclose(fig.get_size_inches(), [5.5, 2.75])
        s.panel_labels(axes)
        self.assertEqual([ax.texts[0].get_text() for ax in axes], ["(a)", "(b)"])
        for ax in axes:
            ax.plot([0, 1], [0, 1]); ax.set_xlabel("Time (s)")
        axes[0].set_ylabel("Value")
        self.assertFalse(any("missing" in problem for problem in s._audit(fig)))
        self.assertEqual(s.family("blue", 1)[0].lower(), s.PALETTE["blue"].lower())
        self.assertEqual(s.family("blue", 3)[-1].lower(), s.PALETTE["blue"].lower())
        self.assertEqual(len(s.CYCLE), 6)
        self.assertEqual(s.plt.rcParams["pdf.fonttype"], 42)
        self.assertEqual(s.plt.rcParams["svg.fonttype"], "none")

    def test_audit_bounds_duplicates_and_outside_ticks(self):
        fig, axes = s.figure_grid(1, 2)
        for ax in axes:
            ax.plot([0, 1], [0, 1])
            ax.set(xlabel="Time", ylabel="Value", title="Duplicate")
            ax.set_xticks([-100, 0, 1, 100])
            ax.set_xlim(0, 1)
        fig.text(1.1, .5, "Outside")
        problems = " ".join(s._audit(fig))
        self.assertIn("duplicate axes titles", problems)
        self.assertIn("text outside canvas: 'Outside'", problems)
        self.assertNotIn("text outside canvas: '−100'", problems)
        self.assertNotIn("text outside canvas: '100'", problems)

    def test_save_reports_audit_failure_and_preserves_written_files(self):
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp:
            fig, ax = s.figure()
            with patch.dict(os.environ, {"PI_OUTPUT_DIR": temp}), patch.object(s, "_audit", side_effect=RuntimeError("review unavailable")), contextlib.redirect_stderr(io.StringIO()) as messages:
                with self.assertRaisesRegex(RuntimeError, "review unavailable"):
                    s.save(fig, "review")
                paths = [Path(temp) / "review.pdf", Path(temp) / "review.svg"]
            self.assertTrue(all(Path(path).is_file() for path in paths))
            self.assertIn("audit FAILED", messages.getvalue())
            self.assertFalse(s.plt.fignum_exists(fig.number))
            kept, _ = s.figure()
            with patch.dict(os.environ, {"PI_OUTPUT_DIR": temp}), patch.object(s, "_audit", side_effect=RuntimeError("review unavailable")), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(RuntimeError):
                    s.save(kept, "review-kept", close=False)
            self.assertTrue(s.plt.fignum_exists(kept.number))
            self.assertTrue((Path(temp) / "review-kept.pdf").is_file())
            with patch.object(fig, "savefig", side_effect=OSError("disk unavailable")):
                with self.assertRaises(OSError):
                    s.save(fig, Path(temp) / "broken")

    def test_single_visible_title_warns_without_failing_save(self):
        fig, ax = s.figure()
        ax.plot([0, 1], [0, 1]); ax.set(xlabel="Time", ylabel="Value", title="Single title")
        self.assertTrue(any("caption" in problem for problem in s._audit(fig)))
        ax.title.set_visible(False)
        self.assertFalse(any("caption" in problem for problem in s._audit(fig)))
        ax.title.set_visible(True)
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp, patch.dict(os.environ, {"PI_OUTPUT_DIR": temp}), contextlib.redirect_stderr(io.StringIO()) as messages:
            paths = s.save(fig, "ordinary-warning")
            self.assertTrue(all(Path(path).is_file() for path in paths))
            self.assertIn("review required", messages.getvalue())

    def test_seven_templates_keep_their_data_semantics(self):
        examples = ROOT / "skills/piresearch/pi-research-figures/examples"
        previous = Path.cwd()
        with tempfile.TemporaryDirectory(dir=OUTPUT) as temp, contextlib.redirect_stdout(io.StringIO()):
            try:
                os.chdir(temp)
                runpy.run_path(str(examples / "software-demo-data.py"), run_name="__main__")
                original_counts = np.load("figs/confusion.npy")
                for name in ("loss_curve", "scaling", "benchmarks", "ablation", "pareto", "sweep", "confusion"):
                    with self.subTest(template=name), patch.object(s, "save") as save:
                        runpy.run_path(str(examples / f"{name}.py"), run_name="__main__")
                        self.assertEqual(save.call_count, 1)
                        fig, stem = save.call_args.args
                        self.assertEqual(stem, f"figs/{name}")
                        ax = fig.axes[0]
                        if name == "loss_curve":
                            self.assertEqual(len(ax.lines), 2)
                            self.assertEqual(len(ax.collections), 2)
                            self.assertEqual(ax.get_xlabel(), "Optimizer steps")
                            self.assertEqual(ax.lines[0].get_color(), s.BASELINE)
                            self.assertEqual({text.get_text() for text in ax.texts}, {"baseline (n=5)", "candidate (n=5)"})
                        elif name == "scaling":
                            self.assertEqual((ax.get_xscale(), ax.get_yscale()), ("log", "log"))
                            self.assertEqual(len(ax.collections), 1)
                            self.assertEqual(len(ax.lines), 2)
                            self.assertIn("fit", ax.lines[0].get_label())
                            self.assertEqual(len(fig.axes), 2)
                        elif name == "benchmarks":
                            self.assertEqual(len(ax.patches), 35)
                            self.assertEqual(len(ax.texts), 35)
                            self.assertEqual(ax.get_xlabel(), "Accuracy (%)")
                        elif name == "ablation":
                            self.assertIn("Welch", ax.get_xlabel())
                            self.assertEqual(len(ax.containers), 2)
                            self.assertEqual([text.get_text() for text in ax.get_yticklabels()], ["removed (n=5)", "ours (n=5)"])
                            self.assertEqual([text.get_text() for text in ax.texts], ["-3.00", "+4.00"])
                            self.assertEqual(ax.containers[1].lines[0].get_color(), s.PALETTE["red"])
                        elif name == "pareto":
                            self.assertEqual([len(points.get_offsets()) for points in ax.collections], [24, 24])
                            self.assertEqual(len(ax.lines), 2)
                            self.assertTrue(all("runs=24" in line.get_label() for line in ax.lines))
                        elif name == "sweep":
                            self.assertEqual(np.ma.getmaskarray(ax.images[0].get_array()).sum(), 1)
                            self.assertEqual(len(ax.texts), 24)
                            self.assertEqual(len(ax.patches), 1)
                            row, col = np.unravel_index(np.nanargmin(ax.images[0].get_array().filled(np.nan)), (5, 5))
                            self.assertEqual(ax.patches[0].get_xy(), (col - .5, row - .5))
                        else:
                            np.testing.assert_allclose(ax.images[0].get_array(), original_counts / original_counts.sum(axis=1, keepdims=True))
                            self.assertEqual([text.get_text() for text in ax.get_xticklabels()], ["ent", "neut", "contra"])
                        s.plt.close(fig)
                counts = original_counts.copy(); counts[0] = 0
                np.save("figs/confusion.npy", counts)
                with patch.object(s, "save") as save:
                    runpy.run_path(str(examples / "confusion.py"), run_name="__main__")
                    fig = save.call_args.args[0]
                    self.assertTrue(np.ma.getmaskarray(fig.axes[0].images[0].get_array())[0].all())
                    self.assertEqual(len(fig.axes[0].texts), 6)
                    np.testing.assert_array_equal(np.load("figs/confusion.npy"), counts)
                np.save("figs/confusion.npy", np.ones((2, 2), dtype=int))
                with self.assertRaisesRegex(ValueError, "configure classes"):
                    runpy.run_path(str(examples / "confusion.py"), run_name="__main__")
                with self.assertRaises(FileExistsError):
                    runpy.run_path(str(examples / "software-demo-data.py"), run_name="__main__")
            finally:
                os.chdir(previous)


if __name__ == "__main__":
    unittest.main(verbosity=2)
