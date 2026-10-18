import {s} from './schema.js';

const obj=<const P extends Record<string,import('./schema.js').JsonSchema>>(p:P,optional:string[]=[])=>s.object(p,Object.keys(p).filter(k=>!optional.includes(k)) as (keyof P&string)[]);
const str=s.string(1000),hash=s.string(64,64),field=s.string(200),num=s.number();
export const SYNTHETIC_FIXTURE_REF_SCHEMA=obj({id:s.string(100),digest:hash,size:s.integer(1,2*1024*1024),generatorVersion:{const:'numeric-regression-v1'},profile:{const:'numeric-regression-v1'},seed:hash,splitDigest:hash});
export const SYNTHETIC_FIXTURE_BINDING_SCHEMA=obj({fixtureRef:SYNTHETIC_FIXTURE_REF_SCHEMA,inputPath:str,inputArgumentIndex:s.integer(1,63)});
export const DRAFT_ROLE_SCHEMA=obj({path:str,role:s.enum(['protocol','implementation','notes'])});
export const PROTOCOL_DOCUMENT_SCHEMA=obj({path:str,digest:hash,compilerVersion:s.string(100)});
const precision=s.nullable(obj({maxHalfWidth:num}));
const planQuantitative=obj({type:{const:'comparison'},template:{const:'paired-rmse-plan-v1'},outcomeUnit:s.string(100),witness:obj({artifactPath:str,recordsPointer:s.string(1000,0),idField:field,observedField:field,baselinePredictionField:field,candidatePredictionField:field}),metrics:obj({baselineRmse:s.string(80),candidateRmse:s.string(80),gain:s.string(80)}),minimumGain:num,decisionOutputs:s.array(obj({artifactPath:str,jsonPointer:s.string(1000,0)}),16),precisionGate:precision,developmentData:obj({mode:{const:'host-synthetic-only'},profile:{const:'numeric-regression-v1'},fixtureRef:SYNTHETIC_FIXTURE_REF_SCHEMA,inputArgumentIndex:s.integer(1,63)}),plan:obj({formalInput:obj({path:str,digest:hash,predictorField:field,outcomeField:field}),models:obj({baseline:obj({family:{const:'polynomial'},degree:{const:1}}),candidate:obj({family:{const:'polynomial'},degree:{const:2}})}),preprocessing:obj({duplicates:s.enum(['retain','drop-exact']),missing:s.enum(['reject','drop-complete-case']),scaling:{const:'training-only'}}),split:obj({testFraction:s.number(0,1),seed:s.integer(0,0xffffffff)})}),provenanceArtifact:str},['decisionOutputs']);
const {decisionOutputs:_,...closedProperties}=planQuantitative.properties;
const closedPlanQuantitative=obj({...closedProperties,template:{const:'paired-rmse-plan-v2'},outputProfile:{const:'paired-evidence-only-v1'},fitImplementation:obj({path:str,entryPoint:field})});
const source=obj({path:str,digest:hash,recordsPointer:s.string(1000,0),recordIdField:field,doiField:field});
const quantitative={anyOf:[obj({type:{const:'descriptive'}}),obj({type:{const:'comparison'},template:{const:'positive-benefit-v1'},gain:obj({metric:s.string(80),unit:s.string(100)}),interval:obj({lowerMetric:s.string(80),upperMetric:s.string(80),unit:s.string(100)}),minimumGain:num,decisionOutputs:s.array(obj({artifactPath:str,jsonPointer:s.string(1000,0)}),16)},['decisionOutputs']),obj({type:{const:'comparison'},template:{const:'paired-rmse-delta-v1'},outcomeUnit:s.string(100),witness:obj({artifactPath:str,recordsPointer:s.string(1000,0),idField:field,observedField:field,baselinePredictionField:field,candidatePredictionField:field}),metrics:obj({baselineRmse:s.string(80),candidateRmse:s.string(80),gain:s.string(80)}),minimumGain:num,decisionOutputs:s.array(obj({artifactPath:str,jsonPointer:s.string(1000,0)}),16)},['decisionOutputs'])]} as const;
const specificationSchema=obj({version:{const:1},literatureSources:s.array(source,32),quantitative:{anyOf:[...quantitative.anyOf,planQuantitative,closedPlanQuantitative]}});
type SpecificationSchemaShape=typeof specificationSchema;
export interface MethodSpecificationSchema extends SpecificationSchemaShape {}
export const METHOD_SPECIFICATION_SCHEMA:MethodSpecificationSchema=specificationSchema;
export const METHOD_CONTRACT_INPUT_SCHEMA=obj({protocolPath:str,specification:METHOD_SPECIFICATION_SCHEMA});
const ledger=obj({sources:s.array(source,32),records:s.array(obj({sourcePath:str,sourceDigest:hash,pointer:s.string(1020),recordIdentity:hash,recordId:s.nullable(s.string(1000,0)),doi:s.nullable(str),reportCandidateId:hash,studyIdentity:{const:'unknown'}}),10000),recordsObserved:s.integer(0,10000),reportCandidates:s.integer(0,10000),confirmedStudyMappings:{const:0},totalStudies:{const:null}});
const boundaries=s.array(obj({gain:num,lower:num,upper:num,decision:s.enum(['criterion_met','nonpositive_estimate','inconclusive']),halfWidth:num,precisionGate:precision},['halfWidth','precisionGate']),15);
const compiled={specification:METHOD_SPECIFICATION_SCHEMA,compilerVersion:s.string(100),contractDigest:hash,protocolDigest:hash,literatureLedger:ledger,boundaryExamples:boundaries};
const frozenSchema=obj({...compiled,protocolPath:str});
type FrozenSchemaShape=typeof frozenSchema;
export interface FrozenMethodContractSchema extends FrozenSchemaShape {}
export const FROZEN_METHOD_CONTRACT_SCHEMA:FrozenMethodContractSchema=frozenSchema;
export const METHOD_REQUIREMENTS_SCHEMA=s.array(s.enum(['literature-identity','quantitative-decision','structured-paired-protocol','closed-paired-evidence']),4);
export const METHOD_INPUT_SCHEMAS={research_method_compile:obj({specification:METHOD_SPECIFICATION_SCHEMA}),research_fixture_prepare:obj({profile:{const:'numeric-regression-v1'},outputProfile:{const:'paired-evidence-only-v1'}},['outputProfile'])} as const;
export const METHOD_OUTPUT_SCHEMAS={research_method_compile:obj({...compiled,protocol:s.string(2*1024*1024)}),research_fixture_prepare:obj({fixtureRef:SYNTHETIC_FIXTURE_REF_SCHEMA,inputPath:str,inputFormat:obj({format:{const:'json-object-rows-v1'},recordsPointer:{const:'/rows'},fields:obj({rowId:{const:'rowId'},partition:{const:'partition'},predictor:{const:'x'},observed:{const:'observed'}}),partitions:obj({train:{const:'train'},test:{const:'test'}})})},['inputFormat'])} as const;
