// Maintainer-generated trusted archive index. Historical text stays in its frozen files.
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ensure} from '../domain/errors.js';
import type {Role} from '../domain/types.js';
import type {SkillPrerequisite} from './types.js';

interface ArchivedSkill {
 id:string;name:string;description:string;path:string;digest:string;roles:readonly Role[];
 resources:readonly {path:string;digest:string;methodRequirements?:readonly string[]}[];
 source?:{repository:string;commit:string;path:string;blob:string};
 prerequisites?:readonly SkillPrerequisite[];
}
interface ArchivedRelease {bundleId:string;manifestDigest:string;skills:readonly ArchivedSkill[]}
const index = [
  {
    "bundleId": "6683733f868b846a6bed3434bba1ff2bdceed99aece0538ac75fe1c70bbd89f2",
    "manifestDigest": "602fd69718ffe349b4ba2ce2531e8b3e427a27f826622da91f7ed070d7f5d367",
    "fileDigest": "e081e227a50ec6fa0018ea85bc1c0569a32917bea507bfe77397ef3150e2cb2a"
  },
  {
    "bundleId": "2a5141eda3efbe5934669fbc86fe95ad72e311c97303615d0d92dcfa78aa60cd",
    "manifestDigest": "2a5141eda3efbe5934669fbc86fe95ad72e311c97303615d0d92dcfa78aa60cd",
    "fileDigest": "02647487a1f5632c5bfd24364790e68789665a0ae0c712df38848c6f3018ccaf"
  },
  {
    "bundleId": "344a44dcf73a8bcb2b2cdf5acf637f756c1763ef05c5ba464bc8285fa45a188b",
    "manifestDigest": "344a44dcf73a8bcb2b2cdf5acf637f756c1763ef05c5ba464bc8285fa45a188b",
    "fileDigest": "32e1f40c6796d6138d33fc336ffaa4f4a431399147e7d74d72b0f8f165c1ab72"
  },
  {
    "bundleId": "547f5f0d9dc3a27db86a26d9747c8b102b73ccc5fb1073b80fba07c2f0fb2feb",
    "manifestDigest": "547f5f0d9dc3a27db86a26d9747c8b102b73ccc5fb1073b80fba07c2f0fb2feb",
    "fileDigest": "5763205386820840ea87ba52b6bc3c032098200e3e2f707523e913043a018d3a"
  },
  {
    "bundleId": "ea9fd8e00f0fc2a5aca8c900f14ea2e97a0b613a6baa5a86111064646b364c5a",
    "manifestDigest": "ea9fd8e00f0fc2a5aca8c900f14ea2e97a0b613a6baa5a86111064646b364c5a",
    "fileDigest": "32183fd975cea1ffd623963608ec0f729303463357c8b5308c98191a5d0be5c6"
  },
  {
    "bundleId": "5593bebb6fff813b6024746fee602370931e1da9961121c9feebaf244fea2326",
    "manifestDigest": "5593bebb6fff813b6024746fee602370931e1da9961121c9feebaf244fea2326",
    "fileDigest": "6611dfe1ab7a64ac78c7206a6cf694c4a93c062240af2df9d4a8f3e4baf07adb"
  },
  {
    "bundleId": "4370f31787be05fc8687303c0ca0ca7052378d45de72e08d9562ab9783f855fc",
    "manifestDigest": "4370f31787be05fc8687303c0ca0ca7052378d45de72e08d9562ab9783f855fc",
    "fileDigest": "7e8dd74f1ae47369f54532a8425dab438aa9aacc7b56e6fac30d726ea0309bd9"
  },
  {
    "bundleId": "ce58da58ca468628efe224f196f4fa9b756095484847de5f253e78f2fe0bbc3a",
    "manifestDigest": "ce58da58ca468628efe224f196f4fa9b756095484847de5f253e78f2fe0bbc3a",
    "fileDigest": "57e80d87b1360f7f98b919443fedced74f6ca593719284c73703f1e298f533b6"
  },
  {
    "bundleId": "14e1170adc7bf3ab02a4b37a44172082d5853732fc1df1bd0aac9fbde70479cb",
    "manifestDigest": "14e1170adc7bf3ab02a4b37a44172082d5853732fc1df1bd0aac9fbde70479cb",
    "fileDigest": "e3720141a105089cd9edbaeb6ad567f6f4756237e128c903fe6c5cae2de4b9d7"
  },
  {
    "bundleId": "8f766452c9ab9af8b19245b323cfad8bfb5f04fd5e0ba08c321946073e96ef52",
    "manifestDigest": "8f766452c9ab9af8b19245b323cfad8bfb5f04fd5e0ba08c321946073e96ef52",
    "fileDigest": "694fdca80c42b4fe716f8bf560fbe39b2a88bdbb672fb1cec46e66060a933659"
  },
  {
    "bundleId": "deacf6d3accce4602e8c28974a85dbebf56dd021e4d48672a2ddf0b0b6ce5715",
    "manifestDigest": "deacf6d3accce4602e8c28974a85dbebf56dd021e4d48672a2ddf0b0b6ce5715",
    "fileDigest": "c6a8fd05bc215303fa11c00baa046d9b6593af7a97bb89ffadb00f10bb41b545"
  },
  {
    "bundleId": "49efbc47bbccc6d19c12d60d77b9721219865dfce73a1f50552ac87bae296ca8",
    "manifestDigest": "49efbc47bbccc6d19c12d60d77b9721219865dfce73a1f50552ac87bae296ca8",
    "fileDigest": "834c139c4cbbbd01a55dd3407ba52d931395c13df95f96e649e65318b21379c8"
  },
  {
    "bundleId": "50e285cf2ea51e8dfa1543894bfce13e14969ff3924f9dfd0ed6599377bb6664",
    "manifestDigest": "50e285cf2ea51e8dfa1543894bfce13e14969ff3924f9dfd0ed6599377bb6664",
    "fileDigest": "ba8c9b1d71cebfcf61fbe23bc07c3409a73cae48adb15cd4a3ed35ea19966be4"
  },
  {
    "bundleId": "cffee2e2842e5cb4c849f99f81f855043ef49237f531ba681f29e99f46ece406",
    "manifestDigest": "cffee2e2842e5cb4c849f99f81f855043ef49237f531ba681f29e99f46ece406",
    "fileDigest": "489aed8074ccacca2ac6b3b42c1b8193f8be0a8675d749acf7539d299b37b42d"
  },
  {
    "bundleId": "7491426e81c2bd54888da1bd03fa517c8c001a981d4356e92024f50259ef863b",
    "manifestDigest": "7491426e81c2bd54888da1bd03fa517c8c001a981d4356e92024f50259ef863b",
    "fileDigest": "459bff83558b7e1c89a8d55eb917d420eea2b1a03fe275d712b4980fce672fb2"
  },
  {
    "bundleId": "2c41de1dd7daeef40043ec76e4a5eeaa6819b575987d3c884c476b434424d5f7",
    "manifestDigest": "2c41de1dd7daeef40043ec76e4a5eeaa6819b575987d3c884c476b434424d5f7",
    "fileDigest": "ec2cbca4478afa61bb6dd95d0dfa5632fb29d8a895c8e8ed71c16668b5338d6e"
  },
  {
    "bundleId": "13b287f05de2899138026917bdecd79f967bb9813cda2bf9ac745fb2fc307509",
    "manifestDigest": "13b287f05de2899138026917bdecd79f967bb9813cda2bf9ac745fb2fc307509",
    "fileDigest": "7e501b621e1b4d84b74fa76102a60ee31d3d3ba51e817694bbe095522841ad30"
  },
  {
    "bundleId": "5f4e3bf3539b3a197bd5a2d71e43d1f8152fc2884afcaaf9a316c5b3f6ac7ac2",
    "manifestDigest": "5f4e3bf3539b3a197bd5a2d71e43d1f8152fc2884afcaaf9a316c5b3f6ac7ac2",
    "fileDigest": "bfe1c5bae76ae2df880c91f83201890a32e77964e97dc0e6aa32e0dc1151c847"
  },
  {
    "bundleId": "4e1944bb74918d76764c87cd63cdb746122c7ab0c0cf73d87dd829a7365070b0",
    "manifestDigest": "4e1944bb74918d76764c87cd63cdb746122c7ab0c0cf73d87dd829a7365070b0",
    "fileDigest": "0bdb4a540503bf7a693652a4ec34eb6146687cd80494b01383c022410dbc8ab7"
  },
  {
    "bundleId": "5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04",
    "manifestDigest": "5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04",
    "fileDigest": "c8d9d4e9f7e9dbc9c0815989f2f5211919db6ce4e25a15136235818b37c80580"
  },
  {
    "bundleId": "1a4077f0830b90bb503e98fc1968a0171caa8136bbb35645487206c484b384e7",
    "manifestDigest": "1a4077f0830b90bb503e98fc1968a0171caa8136bbb35645487206c484b384e7",
    "fileDigest": "1e6d6b473498e76444605ae403fc6e8efbcdace20974a789a7452b37dfdd8ee6"
  },
  {
    "bundleId": "102e4006ccf2cf55439402e59771014af258268d3ed4416ca53c1e9a74d8bdfa",
    "manifestDigest": "102e4006ccf2cf55439402e59771014af258268d3ed4416ca53c1e9a74d8bdfa",
    "fileDigest": "b73efc6a8fec17a44e365fbf363ff4294dabaa0009d69eeefab5681aac82f794"
  },
  {
    "bundleId": "ee525c7337715b07f1382494158f6eeaa3984e48b251d2c313478a179043b009",
    "manifestDigest": "ee525c7337715b07f1382494158f6eeaa3984e48b251d2c313478a179043b009",
    "fileDigest": "7fb607e49a20d78e3477de3ac8394a7c2a9c5bbd01aba183f6b1a27a70824606"
  },
  {
    "bundleId": "65b19e243a1b0571def4f1c664a47d1e723626e8242944c89c057d01f899b620",
    "manifestDigest": "65b19e243a1b0571def4f1c664a47d1e723626e8242944c89c057d01f899b620",
    "fileDigest": "3b465295c4f5f0c60f4a4dbf98aa8cd3eed66c92e0eacb8cbab68e8e1023d1c5"
  },
  {
    "bundleId": "40fedddf46a128cf3e845f25710bb98d1ddb68154949ca1c55341cebecdc02bb",
    "manifestDigest": "40fedddf46a128cf3e845f25710bb98d1ddb68154949ca1c55341cebecdc02bb",
    "fileDigest": "ce258b9fd1096bdd3d46b4677f59d38d365aa0e06db91c88d6af402fb544ca36"
  },
  {
    "bundleId": "eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95",
    "manifestDigest": "eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95",
    "fileDigest": "74085b30d07df4d868690e763418b5e5560c8900826137fb4223d840732c683a"
  },
  {
    "bundleId": "c3c9adcca6b4ece0df4ad5ca3adaf634a115b3b4e0b5998e386d4e2d8b343434",
    "manifestDigest": "c3c9adcca6b4ece0df4ad5ca3adaf634a115b3b4e0b5998e386d4e2d8b343434",
    "fileDigest": "4320414305a99ee5ae75c2e35c5aea01e6d35e3e3180d362fccbf37f95df483f"
  },
  {
    "bundleId": "bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441",
    "manifestDigest": "bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441",
    "fileDigest": "6946f8e3d0561cf77c1c3b7635c7aeb84dead685406a5ae7d1eea7a7be3c8680"
  },
  {
    "bundleId": "6d6bd5b661a6fb02d0e3941878ff5a57b5540ce033915f79e8e15684a6a8e931",
    "manifestDigest": "6d6bd5b661a6fb02d0e3941878ff5a57b5540ce033915f79e8e15684a6a8e931",
    "fileDigest": "12fa55b96ea7a9ebcbf9566075f7b519c4dbb37703cac5657be1c957dbf0c7b1"
  },
  {
    "bundleId": "cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214",
    "manifestDigest": "cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214",
    "fileDigest": "64b1e9182e13ca5931ae1c770383f8d3b05c0de3a226ef15566ec962714baecc"
  },
  {
    "bundleId": "bd3c61039758b0b9e6707605fd8a7753de4e8e8b6c4bd6fc469597c48d29aa9f",
    "manifestDigest": "bd3c61039758b0b9e6707605fd8a7753de4e8e8b6c4bd6fc469597c48d29aa9f",
    "fileDigest": "f2f114eb97de956b8bd4a69923b8ca0298cea213408aa69fb70cc7b93111dc2a"
  },
  {
    "bundleId": "4f49f6cde539fd582c1c8d2caa8bca4f937457ea68c14ccbb79a3219ff2c5091",
    "manifestDigest": "4f49f6cde539fd582c1c8d2caa8bca4f937457ea68c14ccbb79a3219ff2c5091",
    "fileDigest": "d6d9728c369806f3e9268f7eb089ca2bc8a67b5668bea8b0186a005b99a1e668"
  },
  {
    "bundleId": "af8dea8c0cd322ce67ae8657602e8de6cb700411da0e60dbb9f93ad618bdd86e",
    "manifestDigest": "af8dea8c0cd322ce67ae8657602e8de6cb700411da0e60dbb9f93ad618bdd86e",
    "fileDigest": "e8371906a3ba53fff0407d84a3c0b5aa450ffe8bccaed5e3a8e09a896a31de5b"
  },
  {
    "bundleId": "5c2537836e6f59a3981dac5368513018bdf6a08621f8a8c67e58dde5ae4c473d",
    "manifestDigest": "5c2537836e6f59a3981dac5368513018bdf6a08621f8a8c67e58dde5ae4c473d",
    "fileDigest": "bd81d06e39abfa6a7b123d7119854ea92135bf4b2dd47172d1e3c5f55b62af16"
  },
  {
    "bundleId": "45d125ff07c7f1b2b856a624aa140edf887432cc0e84cf181375676df8b65bf2",
    "manifestDigest": "45d125ff07c7f1b2b856a624aa140edf887432cc0e84cf181375676df8b65bf2",
    "fileDigest": "2430793ea48bbf2ec72592fc3f4db155f14fdab5b468d0f7680167de7479c6da"
  },
  {
    "bundleId": "6a24cca1c370257471bff9896d31f5e78d5ef313c29d7172e32d1055189b9be9",
    "manifestDigest": "6a24cca1c370257471bff9896d31f5e78d5ef313c29d7172e32d1055189b9be9",
    "fileDigest": "b97b9ba4f642c804cbb8e7e9ca46f9002c55a1f72f467b67528e16daeecd4306"
  },
  {
    "bundleId": "2596e69858f668445f440cd902b3afa94a53673a8a3a379a2329556dfe5f1aa0",
    "manifestDigest": "2596e69858f668445f440cd902b3afa94a53673a8a3a379a2329556dfe5f1aa0",
    "fileDigest": "6e49b74b182cd37f560e1e89ffcef4367787ab0f0d33d1b7dea0bb786e560437"
  },
  {
    "bundleId": "76710206b59393c7c65d3754d6a7016481b87ce9a528c896b85e66d8b35312da",
    "manifestDigest": "76710206b59393c7c65d3754d6a7016481b87ce9a528c896b85e66d8b35312da",
    "fileDigest": "f484076b4979be84612d07c3e01210fb2c18144f044b3c894b7fc825832e6a17"
  },
  {
    "bundleId": "cf2f0270a626a97a8070804373685ecfd246b556b62d44defbf53e2471f38f90",
    "manifestDigest": "cf2f0270a626a97a8070804373685ecfd246b556b62d44defbf53e2471f38f90",
    "fileDigest": "b5ff2b4bf22b9c7ffc2e5642597c0ca8d86ef45f33b4af427ab9ec7bb283b2cf"
  },
  {
    "bundleId": "cf8638daffd84643b72fd4bfaa298c8daf5eb0d2d36640985916cc57cae463da",
    "manifestDigest": "cf8638daffd84643b72fd4bfaa298c8daf5eb0d2d36640985916cc57cae463da",
    "fileDigest": "97e5abb9bd70a61b2d5fe855652e1459b6c10d93ce3fe7629e6090ec2b543a44"
  },
  {
    "bundleId": "b149e69295f55d092fc7357b2d1134eefdd57bf7e78624ab6a2bc3bf62f17dd9",
    "manifestDigest": "b149e69295f55d092fc7357b2d1134eefdd57bf7e78624ab6a2bc3bf62f17dd9",
    "fileDigest": "026195f409fa3c25a0371aec92b680f70514a85f4281c85a187c445876d32095"
  },
  {
    "bundleId": "cc09953a6f201d8d9abcb6a9bcd292475a8b60febe0f9dbd7e25d8be705abee9",
    "manifestDigest": "cc09953a6f201d8d9abcb6a9bcd292475a8b60febe0f9dbd7e25d8be705abee9",
    "fileDigest": "5053b5dd0ca06637b24f46e67a8f696b8c4a4bb1e0d8c538e7f4dce6f0f7d30d"
  },
  {
    "bundleId": "92adf4d0f0bfa17cd7c8ff8e00578d556c018feaa921ec31952c104fed70c6e1",
    "manifestDigest": "92adf4d0f0bfa17cd7c8ff8e00578d556c018feaa921ec31952c104fed70c6e1",
    "fileDigest": "0b69ddc5379b9809b169245f2facdea06f21ba0d7e0f6ae280a88c2669644c80"
  },
  {
    "bundleId": "3301d03e99d733a987b74b4c51dc4f7a9f92577bd7483445a24da577fba730a6",
    "manifestDigest": "3301d03e99d733a987b74b4c51dc4f7a9f92577bd7483445a24da577fba730a6",
    "fileDigest": "d24768ac5c191728b5295b26062b918855343c779d7d2b9bd657e3c82bfc9558"
  }
] as const;
export const BUILTIN_RELEASES:readonly ArchivedRelease[] = index.map(entry=>({
 bundleId:entry.bundleId,
 get skills(){
  const base=new URL('../../../skills/releases/',import.meta.url);
  for(const path of [new URL('../',base),base,new URL(entry.bundleId+'/',base),new URL(entry.bundleId+'/manifest.json',base)])ensure(!lstatSync(path).isSymbolicLink(),'SKILL_PATH_DENIED','技能发行路径不能包含符号链接');
  const bytes=readFileSync(new URL(entry.bundleId+'/manifest.json',base));
  ensure(createHash('sha256').update(bytes).digest('hex')===entry.fileDigest,'SKILL_INTEGRITY_FAILED','内置技能发行元数据摘要不匹配');
  return (JSON.parse(bytes.toString('utf8')) as ArchivedRelease).skills;
 },
 manifestDigest:entry.manifestDigest,
}));
