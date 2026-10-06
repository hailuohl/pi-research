import type { Role, Actor, Row } from '../domain/types.js';
import type { AppContext } from '../domain/context.js';
import type { SkillPackageRevision, ReviewRecord, SkillRevocation, CapabilityRequirement } from './types.js';
type CatalogEntry = {
    id: string;
    description: string;
    digest: string;
    resources: string[];
    source: {
        repository: string;
        commit: string;
        path: string;
        blob: string;
    };
    revisionId?: string;
    requirements?: CapabilityRequirement;
};
/** Only explicit reviewed packages. Project .pi / AGENTS files are never discovered. */
export declare class SkillService {
    private root;
    private context?;
    readonly bundleId = "5593bebb6fff813b6024746fee602370931e1da9961121c9feebaf244fea2326";
    constructor(root: string, context?: AppContext | undefined);
    private get c();
    private builtin;
    private builtinReleases;
    list(role: Role, builtinBundleId?: string): CatalogEntry[];
    private verifiedBytes;
    private verified;
    read(role: Role, id: string, resource?: string, builtinBundleId?: string): {
        id: string;
        resource: string;
        content: string;
        digest: "171c8c52a3f6c6030186a7012b458deae1b32cabad5e7be21fa1c7119360de8b" | "434e8ef80ff38899bc9fc00e1d065cd2860e3b415dce9828f871ada63576e708" | "9da51b89dee04b7862cb9f2a52ea73ea1194f659a9a1088e033bdf618bd568a0" | "4b7f5b525d6cb00353909b672eae3674f4d83523965f3d946ca0c13e3c0e85cf" | "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d" | "c62ec4a09db90b2d05033539652715d39d71cc57ff1e69e28f848251ca30a70e" | "5a33728ecd0f7ee91e360749c4ae03d85bb0526f6027ad032fcc45b61b25cb33" | "ef026f3710e61d28e32bf01a5800332dd242c71f661d3b6fd4118f97cddcda83" | "246f0f316890b0a20e9d1fd11395c8508235490b22b47350198c9fb05ccd3b57" | "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a" | "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e" | "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df" | "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9" | "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7" | "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a" | "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823" | "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18" | "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f" | "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917" | "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71" | "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af" | "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d" | "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3" | "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4" | "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d" | "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e" | "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae" | "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2" | "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3" | "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe" | "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7" | "0512c87bb2dea06aaee360aae8a27fd09c0fa899823ebf212d7b708d801a5860" | "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974" | "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9" | "c85db475aee1b461f91d86ac598bbe3a270b485c5f4194de84907d4846d5de94" | "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546" | "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50" | "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806" | "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a" | "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6" | "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91" | "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56" | "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3" | "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7" | "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62" | "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2" | "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097" | "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1" | "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854" | "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7" | "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8" | "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728" | "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162" | "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3" | "722fb5b708289ccd369e789831ba816d5a957dd053e409e3fa2b018f03407936" | "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01" | "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc" | "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba" | "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd" | "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6" | "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a" | "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734" | "de7dea0bda7027b4c315e25bc3697fb2e5b228174434ae11a2158661b6828022" | "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6" | "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5" | "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808" | "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced" | "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4" | "7f49408c562c43864ff8382971fab467344b2a095e413a93a045966bdae39a1d" | "b7bf1a0d303d53a73239d597a5415c302c77889d204e8cc35f75ea74a43a5298" | "466fb9db080bfbea1ad67044985d0405c4d8bde132a34c993eb6b55e704e6066" | "b70d2802a9be595a72c505c3b4631487c4f5b9e7312f7c60ab9f4a11f90498cd" | "a616fa56550323e89283517ac75337bc4c79cdd6e8434d096162d4d6b99f595b";
        bundleId: string;
        source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    };
    bootstrap(role: Role): {
        bundleId: string;
        prompt: string;
        skills: {
            name: string;
            description: string;
            filePath: string;
            baseDir: string;
            source: string;
            disableModelInvocation: boolean;
        }[];
    };
    private bootstrapEntries;
    private owner;
    private revision;
    private resolveBundle;
    private disabledIds;
    private noCollisions;
    private approved;
    import(actor: Actor, pid: string, input: unknown, key: string): Row<SkillPackageRevision>;
    upload(actor: Actor, pid: string, input: unknown, key: string): {
        revision: Row<SkillPackageRevision>;
        configuration: {
            builtinBundleId: string;
            disabledBuiltinIds: string[];
            bundleId: string;
            revisionIds: string[];
            version: number;
        };
    };
    enable(actor: Actor, pid: string, value: unknown, key: string): {
        revision: Row<SkillPackageRevision>;
        configuration: {
            builtinBundleId: string;
            disabledBuiltinIds: string[];
            bundleId: string;
            revisionIds: string[];
            version: number;
        };
    };
    review(actor: Actor, pid: string, value: unknown, key?: string): Row<ReviewRecord>;
    revoke(actor: Actor, pid: string, value: unknown, key?: string): Row<SkillRevocation>;
    configuration(pid: string): {
        version: number;
        bundleId: string;
        builtinBundleId: string;
        revisionIds: string[];
        disabledBuiltinIds: string[];
    };
    private saveConfiguration;
    configure(actor: Actor, pid: string, value: unknown, key?: string): {
        builtinBundleId: string;
        disabledBuiltinIds: string[];
        bundleId: string;
        revisionIds: string[];
        version: number;
    };
    delete(actor: Actor, pid: string, value: unknown, key?: string): {
        builtinBundleId: string;
        disabledBuiltinIds: string[];
        bundleId: string;
        revisionIds: string[];
        version: number;
    };
    inspect(actor: Actor, pid: string, revisionId: string): {
        revision: Row<SkillPackageRevision>;
        reviews: Row<ReviewRecord>[];
        revocations: Row<SkillRevocation>[];
    };
    catalog(actor: Actor, pid: string): {
        configuration: {
            version: number;
            bundleId: string;
            builtinBundleId: string;
            revisionIds: string[];
            disabledBuiltinIds: string[];
        };
        builtinSkills: CatalogEntry[];
        builtinReleases: {
            bundleId: string;
            current: boolean;
            skillCount: 13 | 14;
        }[];
        revisions: {
            revision: Row<SkillPackageRevision>;
            reviews: Row<ReviewRecord>[];
            revocations: Row<SkillRevocation>[];
        }[];
    };
    readRevision(actor: Actor, pid: string, revisionId: string, resource?: string): {
        revisionId: string;
        resource: string;
        digest: string;
        mediaType: "image/png";
        contentBase64: string;
        content?: undefined;
    } | {
        revisionId: string;
        resource: string;
        content: string;
        digest: string;
        mediaType?: undefined;
        contentBase64?: undefined;
    };
    private revisionBytes;
    private revisionText;
    private entry;
    bundleCatalog(pid: string, role: Role, bundleId: string): {
        bundleId: string;
        builtinBundleId: string;
        revisionIds: string[];
        skills: CatalogEntry[];
    };
    bundleRead(pid: string, role: Role, bundleId: string, id: string, resource?: string): {
        bundleId: string;
        id: string;
        resource: string;
        content: string;
        digest: "171c8c52a3f6c6030186a7012b458deae1b32cabad5e7be21fa1c7119360de8b" | "434e8ef80ff38899bc9fc00e1d065cd2860e3b415dce9828f871ada63576e708" | "9da51b89dee04b7862cb9f2a52ea73ea1194f659a9a1088e033bdf618bd568a0" | "4b7f5b525d6cb00353909b672eae3674f4d83523965f3d946ca0c13e3c0e85cf" | "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d" | "c62ec4a09db90b2d05033539652715d39d71cc57ff1e69e28f848251ca30a70e" | "5a33728ecd0f7ee91e360749c4ae03d85bb0526f6027ad032fcc45b61b25cb33" | "ef026f3710e61d28e32bf01a5800332dd242c71f661d3b6fd4118f97cddcda83" | "246f0f316890b0a20e9d1fd11395c8508235490b22b47350198c9fb05ccd3b57" | "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a" | "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e" | "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df" | "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9" | "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7" | "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a" | "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823" | "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18" | "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f" | "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917" | "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71" | "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af" | "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d" | "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3" | "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4" | "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d" | "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e" | "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae" | "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2" | "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3" | "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe" | "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7" | "0512c87bb2dea06aaee360aae8a27fd09c0fa899823ebf212d7b708d801a5860" | "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974" | "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9" | "c85db475aee1b461f91d86ac598bbe3a270b485c5f4194de84907d4846d5de94" | "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546" | "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50" | "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806" | "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a" | "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6" | "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91" | "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56" | "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3" | "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7" | "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62" | "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2" | "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097" | "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1" | "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854" | "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7" | "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8" | "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728" | "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162" | "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3" | "722fb5b708289ccd369e789831ba816d5a957dd053e409e3fa2b018f03407936" | "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01" | "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc" | "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba" | "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd" | "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6" | "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a" | "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734" | "de7dea0bda7027b4c315e25bc3697fb2e5b228174434ae11a2158661b6828022" | "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6" | "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5" | "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808" | "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced" | "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4" | "7f49408c562c43864ff8382971fab467344b2a095e413a93a045966bdae39a1d" | "b7bf1a0d303d53a73239d597a5415c302c77889d204e8cc35f75ea74a43a5298" | "466fb9db080bfbea1ad67044985d0405c4d8bde132a34c993eb6b55e704e6066" | "b70d2802a9be595a72c505c3b4631487c4f5b9e7312f7c60ab9f4a11f90498cd" | "a616fa56550323e89283517ac75337bc4c79cdd6e8434d096162d4d6b99f595b";
        source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "SKILL.md";
            readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-create/SKILL.md";
            readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
            readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-reports/SKILL.md";
            readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-figures/SKILL.md";
            readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-customize/SKILL.md";
            readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-feedback/SKILL.md";
            readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
        } | {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    } | {
        bundleId: string;
        source: {
            repository: string;
            commit: string;
            path: string;
            blob: string;
        };
        resource: string;
        content: string;
        digest: string;
        id: string;
    };
    bundleBootstrap(pid: string, role: Role, bundleId: string): {
        bundleId: string;
        prompt: string;
        skills: {
            name: string;
            description: string;
            filePath: string;
            baseDir: string;
            source: string;
            disableModelInvocation: boolean;
        }[];
    };
    ensureBundleStartAllowed(pid: string, bundleId: string): {
        bundleId: string;
        revisionIds: string[];
    };
}
export {};
