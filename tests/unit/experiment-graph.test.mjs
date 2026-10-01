import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronousState } from '../support/ui.mjs';

const experiment = (id, parentId = null) => ({ id, parentId, title: id, lifecycle: 'provisional', contract: { metrics: {} }, contractDigest: 'contract' });
const project = (experiments, runs = []) => ({ project: { id: 'project' }, experiments, runs });
const elements = node => {
    if (Array.isArray(node)) return node.flatMap(elements);
    if (!node || typeof node !== 'object') return [];
    if (typeof node.type === 'function') return elements(node.type(node.props));
    return [node, ...elements(node.props?.children)];
};

test('graph layout centers parents over siblings and orders descendants after parents', async () => {
    const { layoutExperiments } = await import('../../dist/web/assets/experiment-graph.js');
    const layout = layoutExperiments([experiment('root'), experiment('left', 'root'), experiment('right', 'root'), experiment('leaf', 'left')]);
    assert.deepEqual(layout.nodes.map(node => [node.experiment.id, node.depth]), [['root', 0], ['left', 1], ['leaf', 2], ['right', 1]]);
    const [root, left, , right] = layout.nodes;
    assert.ok(root.y < left.y);
    assert.ok(left.x < right.x);
    assert.equal(root.x + 112, (left.x + right.x + 224) / 2);
    assert.deepEqual(layout.edges, [{ parentId: 'root', childId: 'left' }, { parentId: 'left', childId: 'leaf' }, { parentId: 'root', childId: 'right' }]);
});

test('orphan and cyclic components retain every node and cut only the invalid cycle edge', async () => {
    const { layoutExperiments } = await import('../../dist/web/assets/experiment-graph.js');
    const layout = layoutExperiments([
        experiment('orphan', 'missing-parent'), experiment('orphan-child', 'orphan'),
        experiment('cycle-b', 'cycle-a'), experiment('cycle-a', 'cycle-b'), experiment('cycle-child', 'cycle-b')
    ]);
    assert.equal(layout.nodes.length, 5);
    const byId = new Map(layout.nodes.map(node => [node.experiment.id, node]));
    assert.equal(byId.get('orphan').missingParentId, 'missing-parent');
    assert.equal(byId.get('orphan-child').parentId, 'orphan');
    assert.equal(byId.get('cycle-a').brokenCycle, true);
    assert.equal(byId.get('cycle-b').inCycle, true);
    assert.ok(!layout.edges.some(edge => edge.parentId === 'cycle-b' && edge.childId === 'cycle-a'));
    assert.ok(layout.edges.some(edge => edge.parentId === 'cycle-a' && edge.childId === 'cycle-b'));
});

test('deep parent chains lay out iteratively without dropping nodes', async () => {
    const { layoutExperiments } = await import('../../dist/web/assets/experiment-graph.js');
    const experiments = Array.from({ length: 12000 }, (_, i) => experiment(`node-${i}`, i ? `node-${i - 1}` : null));
    const layout = layoutExperiments(experiments);
    assert.equal(layout.nodes.length, experiments.length);
    assert.equal(layout.nodes.at(-1).depth, experiments.length - 1);
});

test('selecting a graph or list node calls only onSelect and leaves project data intact', async () => {
    const { ExperimentGraph } = await import('../../dist/web/assets/experiment-graph.js');
    const data = project([experiment('root'), experiment('child', 'root'), experiment('orphan', 'missing')], [
        { id: 'run-infinite', experimentId: 'root', state: 'succeeded', integrity: 'complete', metrics: { mse: Number.POSITIVE_INFINITY }, manifest: { contract: { metrics: { mse: { unit: 'score' } } } } },
        { id: 'run-incomplete', experimentId: 'root', state: 'failed', integrity: 'incomplete', metrics: { mse: 0.75 }, manifest: { contract: { metrics: { mse: { unit: 'score' } } } } },
        { id: 'run-1', experimentId: 'child', state: 'succeeded', integrity: 'complete', metrics: { mse: 0.125 }, manifest: { contract: { metrics: { mse: { unit: 'score' } } } } }
    ]);
    const before = JSON.stringify(data);
    const selected = [];
    const graph = synchronousState(new ExperimentGraph({ data, selected: '', onSelect: id => selected.push(id) }));
    graph.state.scale=0.02;
    elements(graph.render()).find(node=>node.props?.['aria-label']==='缩小').props.onClick();
    assert.ok(graph.state.scale<0.02,'zooming out after fitting a large tree must not jump inward');
    const graphCard = elements(graph.render()).find(node => node.props?.['data-experiment-id'] === 'root');
    graphCard.props.onClick();
    const listToggle = elements(graph.render()).find(node => node.props?.['data-view-mode'] === 'list');
    listToggle.props.onClick();
    const cards = elements(graph.render()).filter(node => node.type === 'button' && node.props?.['data-experiment-id']);
    assert.deepEqual(cards.map(node => node.props['data-experiment-id']), ['root', 'child', 'orphan']);
    cards.find(node => node.props['data-experiment-id'] === 'child').props.onClick();
    assert.deepEqual(selected, ['root', 'child']);
    assert.equal(JSON.stringify(data), before);
    const rendered = elements(graph.render());
    assert.deepEqual(rendered.filter(node => node.props?.className === 'experiment-graph-metric').map(node => node.props.children), [
        '暂无有效指标', '最近完整指标 · mse 0.12500 score', '暂无有效指标'
    ]);
    assert.ok(rendered.some(node => node.props?.className === 'experiment-graph-warning'));
    assert.ok(rendered.some(node=>node.props?.className==='experiment-graph-relation'&&node.props.children==='派生自 root'));
});
