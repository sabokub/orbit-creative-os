Exit code: 0
Wall time: 1.5 seconds
Output:
import { CreativeIntent } from "./contracts";
export const VISUAL_FIXTURES:CreativeIntent[]=[
 {id:"interior-editorial",projectId:"demo",rawRequest:"Create an editorial lifestyle interior",assetType:"image",objective:"Campaign hero",subject:"A sculptural lounge chair",environment:"Warm Paris apartment with lived-in details",narrative:"",emotionalIntent:"quiet confidence",audience:"design-conscious founders",usage:"website hero",platform:"web",aspectRatio:"16:9",references:[],mandatoryElements:["warm stone","burgundy accent"],forbiddenElements:["generic luxury styling"],preservationConstraints:[],qualityTarget:"production-ready",generators:["gpt-image","nano-banana","midjourney"]},
 {id:"salon-edit",projectId:"demo",rawRequest:"Replace the sofa while preserving the room",assetType:"image-edit",objective:"Interior option",subject:"Low modular sofa",environment:"Existing living room",narrative:"",emotionalIntent:"warm modernism",audience:"client",usage:"presentation",platform:"deck",aspectRatio:"4:5",references:[{id:"room",type:"environment",role:"primary source image",importance:1,reuse:["architecture","lighting"],avoid:[]}],mandatoryElements:[],forbiddenElements:[],preservationConstraints:["architecture","camera position","daylight"],qualityTarget:"photoreal",generators:["gpt-image","nano-banana"]},
 {id:"sora-travel",projectId:"demo",rawRequest:"Slow travelling shot through an interior",assetType:"video",objective:"Launch film",subject:"A person crossing a refined living room",environment:"Sunlit modernist apartment",narrative:"person walks from foreground to balcony",emotionalIntent:"anticipation",audience:"social audience",usage:"social launch",platform:"Instagram",aspectRatio:"9:16",duration:8,references:[],mandatoryElements:[],forbiddenElements:["fast cuts"],preservationConstraints:["room layout","person identity"],qualityTarget:"cinematic",generators:["sora"]}
];

