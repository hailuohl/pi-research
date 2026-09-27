export const CONNECTOR_CAPABILITIES = [
 {id:'alphaxiv',category:'literature',operations:['keyword','embedding','paper-text'],implementation:'http-adapter',verification:'fixture-only',credential:'none',content:'retrieved-text; no PDF page mapping'},
 {id:'openalex',category:'literature',operations:['search','paper-metadata','paper-abstract'],implementation:'http-adapter',verification:'fixture-only',credential:'optional OPENALEX_API_KEY'},
 {id:'biorxiv',category:'literature',operations:['search-via-openalex','paper-abstract'],implementation:'http-adapter',verification:'fixture-only',credential:'optional OPENALEX_API_KEY for search'},
 {id:'pubmed',category:'literature',operations:['esearch','efetch-abstract'],implementation:'http-adapter',verification:'fixture-only',credential:'NCBI_EMAIL recommended; NCBI_API_KEY optional'},
 {id:'crossref',category:'literature',operations:['search','paper-metadata'],implementation:'http-adapter',verification:'fixture-only',credential:'none'},
 {id:'trusted-example',category:'compute',operations:['submit','inspect','cancel','logs','collect'],implementation:'existing-runner',verification:'local-example-tested',limitation:'Only the pinned bundled numeric code; not arbitrary scripts'},
 {id:'docker',category:'compute',operations:['submit','inspect','cancel','logs','collect'],implementation:'existing-runner',verification:'not-live-tested',limitation:'User-pinned image, no proven deployment in this session'},
 ...['ssh','slurm','k8s','ray','hf','modal','tinker','managed-compute'].map(id=>({id,category:'compute',operations:[],implementation:'not-implemented',verification:'unavailable',limitation:'Guide adapted; no job submission adapter supplied'})),
 {id:'code-handoff',category:'collaboration',operations:['prepare','inspect','approve-user','apply-user'],implementation:'existing-service',verification:'local-tests',limitation:'Creates child snapshot; not Git merge/push'},
 ...['overleaf','git-publish','latex-compile','standalone-instances'].map(id=>({id,category:'publication',operations:[],implementation:'not-implemented',verification:'unavailable',limitation:'No connection, authentication or external side effects'})),
];
