(()=>{
let tries=0;
function start(){
  tries++;
  if(typeof BANK==='undefined'||!Array.isArray(BANK)||!BANK.length||typeof render!=='function'){
    if(tries<160)setTimeout(start,100);
    return;
  }
  if(window.PSLE_STYLE_QUESTIONS?.installed)return;

  const mk=(question,kind)=>({question,kind,rubric:[],modelApplicationAnswer:''});
  const lc=s=>String(s||'').toLowerCase();
  const has=(t,...xs)=>xs.some(x=>t.includes(x));
  const core=e=>e.modelApplicationAnswer||e.phrase||'';
  const pack=(e,arr)=>arr.map(x=>({question:x.question,kind:x.kind,rubric:Array.isArray(e.rubric)?e.rubric:[],modelApplicationAnswer:core(e)}));

  function diversity(e,t){
    if(has(t,'classification'))return pack(e,[
      mk('Four organisms have these observed features: P has feathers and lays eggs; Q has scales and lays eggs; R has hair and gives birth to young; S has moist skin and lays eggs in water. A pupil wants to classify them into groups. State one useful characteristic the pupil can use and explain how it separates the organisms.','PSLE-style · Classification · 2 marks'),
      mk('Two pupils classify the same set of living things differently. Pupil A groups them by where they were found. Pupil B groups them by common body characteristics. Which method gives a more scientific classification? Explain your answer.','PSLE-style · Reasoning · 2 marks'),
      mk('A newly discovered animal has wings, six legs and an outer body covering. Explain how scientists could decide which group it belongs to without using its size or colour alone.','PSLE-style · Novel context · 2 marks')
    ]);
    if(has(t,'seed','spore'))return pack(e,[
      mk('A pupil observes two plants. Plant P produces flowers and later forms structures containing seeds. Plant Q does not form flowers but produces tiny powder-like structures under its leaves. State how the two plants reproduce differently.','PSLE-style · Observation · 2 marks'),
      mk('After rain, many new fern plants appear near an old fern even though no fruits were produced. Suggest how the new plants could have arisen and how the reproductive structures may have reached the new locations.','PSLE-style · Inference · 2 marks'),
      mk('A class is given a flowering plant and a non-flowering plant. Describe one observation that could provide evidence that they reproduce by different structures.','PSLE-style · Evidence · 2 marks')
    ]);
    return pack(e,[
      mk('Object P moves when pushed but never grows. Organism Q grows, needs water and produces young. Give two pieces of evidence that Q is living and explain why movement alone is not enough to show that P is living.','PSLE-style · Evidence · 3 marks'),
      mk('A dry seed shows no visible movement for several days. A pupil says it cannot be living. Use characteristics of living things to explain why the pupil may be wrong.','PSLE-style · Reasoning · 2 marks'),
      mk('Scientists find an unfamiliar object. State two observations they could make over time to determine whether it is a living thing.','PSLE-style · Investigation · 2 marks')
    ]);
  }

  function plantStructures(e,t){
    if(has(t,'water transport','roots — absorption'))return pack(e,[
      mk('Two similar leafy shoots are placed in coloured water. Shoot P has an intact stem while the lower part of Shoot Q is badly damaged. After 2 hours, coloured dye is seen much higher in P than in Q. Use the observation to explain the function of the relevant plant part.','PSLE-style · Experiment · 3 marks'),
      mk('A plant is removed from soil and its roots are wrapped in a waterproof material before being placed back into moist soil. Predict what will happen to the plant after some time and explain why.','PSLE-style · Prediction · 2 marks'),
      mk('A pupil wants to find out whether water absorbed by roots reaches the leaves through the stem. Describe one observation in a simple coloured-water investigation that would support this conclusion.','PSLE-style · Method · 2 marks')
    ]);
    if(has(t,'food transport','leaves — photosynthesis'))return pack(e,[
      mk('A ring of tissue is removed from the stem of a healthy plant without damaging the water-carrying tubes. After several days, swelling is observed above the cut. Explain why food accumulates there.','PSLE-style · Experiment · 3 marks'),
      mk('A plant has several leaves removed but still receives enough water. After a week, its growth is slower than an identical plant with all leaves intact. Explain the difference.','PSLE-style · Comparison · 2 marks'),
      mk('A pupil covers both sides of one green leaf with opaque paper while leaving another leaf uncovered. After several hours in sunlight, how could the pupil use the two leaves to investigate the food-making function of leaves?','PSLE-style · Investigation · 3 marks')
    ]);
    if(has(t,'support','anchorage'))return pack(e,[
      mk('Two similar young plants are exposed to the same strong wind. Plant P has an intact stem and root system. Plant Q has weakened supporting structures. Q bends and is uprooted more easily. Explain the observations using the functions of plant parts.','PSLE-style · Evidence · 3 marks'),
      mk('A tall plant grows in deep soil while a similar plant grows in very loose shallow soil. Predict which is more likely to topple in strong wind and explain why.','PSLE-style · Prediction · 2 marks'),
      mk('A pupil claims roots only absorb water. Give evidence from another root function that shows the claim is incomplete.','PSLE-style · Evaluation · 2 marks')
    ]);
    if(has(t,'flower','fruit','seed'))return pack(e,[
      mk('A gardener removes all flowers from Plant P but leaves Plant Q unchanged. Both plants receive the same water and light. Several weeks later, fruits form only on Q. Explain the difference.','PSLE-style · Experiment · 2 marks'),
      mk('A fruit is damaged so that many of its seeds are exposed. Explain how this could reduce the plant\'s chance of successful reproduction.','PSLE-style · Application · 2 marks'),
      mk('Two identical flowering plants are grown under the same conditions. One produces many healthy flowers but no fruits. Suggest one reproductive process that may not have occurred successfully and explain your answer.','PSLE-style · Inference · 2 marks')
    ]);
    return pack(e,[
      mk(`A pupil damages the plant part associated with ${e.topic.toLowerCase()} while keeping the other conditions unchanged. Predict one effect on the plant and explain it using the function of that part.`,'PSLE-style · Application · 2 marks'),
      mk(`Two similar plants differ only in the condition of the structure involved in ${e.topic.toLowerCase()}. Describe one fair comparison that could show the function of that structure.`,'PSLE-style · Investigation · 2 marks'),
      mk(`A plant survives poorly after a particular structure is removed. Explain how the function involved in ${e.topic.toLowerCase()} could account for the observation.`,'PSLE-style · Reasoning · 2 marks')
    ]);
  }

  function lifeCycles(e,t){
    if(has(t,'germination'))return pack(e,[
      mk('Four sets of seeds are kept for 5 days. A: moist cotton, air, 25°C, dark. B: dry cotton, air, 25°C, light. C: moist cotton, no air, 25°C, light. D: moist cotton, air, 5°C, light. Only A germinates well. Use the results to state the conditions needed for germination and explain why light cannot be concluded to be necessary.','PSLE-style · Data · 4 marks'),
      mk('A pupil investigates whether light is needed for germination. Both sets of seeds receive water, air and the same temperature, but only one set is kept in darkness. Both sets germinate. What conclusion should the pupil make?','PSLE-style · Conclusion · 2 marks'),
      mk('Two identical seeds begin germinating. In Seed P the young root appears before the shoot. Explain how this order of growth helps the young plant.','PSLE-style · Application · 2 marks')
    ]);
    if(has(t,'seed dispersal'))return pack(e,[
      mk('Seeds P, Q and R have these features: P is very light with a wing; Q has hooks; R has a fibrous waterproof husk. Match each seed to its most likely dispersal method and explain one match using its feature.','PSLE-style · Data · 4 marks'),
      mk('Two plants of the same kind grow close together. Most new seedlings appear several metres away from the parent plants. Explain one advantage of this pattern to the seedlings.','PSLE-style · Reasoning · 2 marks'),
      mk('A fruit splits suddenly when dry and its seeds are found some distance from the parent plant. Explain how the fruit structure helps dispersal.','PSLE-style · Observation · 2 marks')
    ]);
    if(has(t,'pollination','pollen tube','fertilisation','ovary','ovule'))return pack(e,[
      mk('A pupil covers Flower P with a fine bag before it opens and leaves Flower Q uncovered. Both flowers remain healthy. Later, Q forms a fruit but P does not. Suggest which process was prevented in P and explain how this affected fruit formation.','PSLE-style · Experiment · 3 marks'),
      mk('Pollen grains reach the stigma of a flower, but the pollen tube fails to grow. Explain why a seed may not form.','PSLE-style · Cause-effect · 2 marks'),
      mk('After a successful reproductive process, a flower loses its petals and its ovary becomes larger. State what the ovary and ovules will develop into.','PSLE-style · Inference · 2 marks')
    ]);
    if(has(t,'metamorphosis','life cycle','young and adult','pupal'))return pack(e,[
      mk('An insect is observed at four stages: egg, feeding larva, inactive pupa and winged adult. Explain why the life cycle is described as complete metamorphosis.','PSLE-style · Observation · 2 marks'),
      mk('Another insect has no pupal stage, and each young stage looks increasingly like the adult. Compare this life cycle with complete metamorphosis.','PSLE-style · Compare · 3 marks'),
      mk('A pupil finds a small organism that looks very different from the adult of the same kind. Explain why appearance alone cannot be used to conclude that they are different kinds of organisms.','PSLE-style · Reasoning · 2 marks')
    ]);
    if(has(t,'human','umbilical','womb','inherited','acquired'))return pack(e,[
      mk('A child has the same natural eye colour as one parent but develops stronger arm muscles after months of training. Which characteristic is inherited and which is acquired? Explain the difference.','PSLE-style · Application · 3 marks'),
      mk('A developing baby does not eat food directly. Explain how it can still obtain nutrients needed for growth.','PSLE-style · Transfer · 2 marks'),
      mk('One sperm cell joins one egg cell and the resulting cell later develops inside the mother. Name the first process and state where development occurs.','PSLE-style · Sequence · 2 marks')
    ]);
    return pack(e,[
      mk('A population of organisms survives for many years even though individual organisms eventually die. Explain how reproduction helps the kind continue.','PSLE-style · Reasoning · 2 marks'),
      mk(`A pupil observes a change associated with ${e.topic.toLowerCase()} in a living thing. Explain how this observation fits into the organism's life cycle or reproduction.`,'PSLE-style · Application · 2 marks'),
      mk(`State one observation that would provide evidence for the science idea involved in ${e.topic.toLowerCase()}.`,'PSLE-style · Evidence · 2 marks')
    ]);
  }

  function humanSystems(e,t){
    if(has(t,'exercise','heart rate','breathing rate'))return pack(e,[
      mk('A pupil records these values: resting heart rate 76 beats/min and breathing rate 16 breaths/min; after running, heart rate 132 beats/min and breathing rate 30 breaths/min. Explain why both rates increase after exercise.','PSLE-style · Data · 4 marks'),
      mk('Two pupils run the same distance. Pupil P returns to resting heart rate faster than Q. State one measurement that should be kept the same if their recovery is to be compared fairly.','PSLE-style · Fair test · 2 marks'),
      mk('During vigorous exercise, muscles respire faster. Explain how the respiratory and circulatory systems work together to meet the muscles\' needs.','PSLE-style · Systems · 3 marks')
    ]);
    if(has(t,'lung','gill','gaseous exchange','respiratory'))return pack(e,[
      mk('Air entering the lungs contains more oxygen and less carbon dioxide than air leaving the lungs. Explain what happens to the two gases at the lungs.','PSLE-style · Data · 2 marks'),
      mk('Water entering a fish\'s gills has more dissolved oxygen than water leaving the gills. Blood leaving the gills has more oxygen than blood entering them. Use the observations to explain gaseous exchange at the gills.','PSLE-style · Evidence · 3 marks'),
      mk('A blockage reduces the movement of air into the lungs. Predict one effect on the amount of oxygen reaching body cells and explain your answer.','PSLE-style · Prediction · 2 marks')
    ]);
    if(has(t,'digest','small intestine','large intestine'))return pack(e,[
      mk('After a meal, the amount of digested food in blood leaving the small intestine is greater than in blood entering it. Explain the observation.','PSLE-style · Data · 2 marks'),
      mk('A person has difficulty breaking large food molecules into simpler substances. Explain why this can reduce the amount of nutrients absorbed into the blood.','PSLE-style · Cause-effect · 2 marks'),
      mk('Water content in undigested food decreases as it passes through the large intestine. State the process that explains this change.','PSLE-style · Evidence · 2 marks')
    ]);
    if(has(t,'circulatory','heart','blood'))return pack(e,[
      mk('A dye injected into the blood at the arm is later detected at many body parts. Explain how the circulatory system makes this possible.','PSLE-style · Novel context · 2 marks'),
      mk('A patient\'s heart is unable to pump effectively. Predict one effect on the delivery of oxygen to muscles and explain why.','PSLE-style · Prediction · 2 marks'),
      mk('Blood leaving the lungs contains more oxygen than blood entering the lungs. Explain how the respiratory and circulatory systems work together to produce this difference.','PSLE-style · Systems · 3 marks')
    ]);
    return pack(e,[
      mk(`A person has a problem with the body structure involved in ${e.topic.toLowerCase()}. Predict one effect on the body and explain it using the function of that structure or system.`,'PSLE-style · Application · 2 marks'),
      mk(`Describe one observation or measurement that could provide evidence for the function involved in ${e.topic.toLowerCase()}.`,'PSLE-style · Evidence · 2 marks'),
      mk(`Explain how ${e.topic.toLowerCase()} contributes to keeping the body functioning normally.`,'PSLE-style · Systems · 2 marks')
    ]);
  }

  function plantProcesses(e,t){
    if(has(t,'water-carrying','food-carrying','damaged'))return pack(e,[
      mk('A leafy shoot is placed in red-coloured water. After 2 hours, red colour is seen in narrow tubes in the stem and leaf veins. What does this observation show about transport in the plant?','PSLE-style · Experiment · 2 marks'),
      mk('A ring of food-carrying tissue is removed from a stem. Several days later, sugars accumulate above the ring while the roots receive less food. Explain both observations.','PSLE-style · Cause-effect · 3 marks'),
      mk('A plant stem is crushed so that both transport systems are badly damaged. Predict what will happen to the plant after some time and explain why.','PSLE-style · Prediction · 3 marks')
    ]);
    if(has(t,'photosynthesis','starch','sun as energy'))return pack(e,[
      mk('A destarched plant has one leaf partly covered with opaque paper and is placed in sunlight. After several hours, only the uncovered green part tests positive for starch. Use the result to explain what was needed for food-making.','PSLE-style · Experiment · 3 marks'),
      mk('Two identical green plants receive the same water and carbon dioxide. Plant P is kept in bright light and Plant Q in darkness. Predict which plant makes more food and explain why.','PSLE-style · Prediction · 2 marks'),
      mk('A pond plant in bright light gives off bubbles. A gas test shows the bubbles contain oxygen. Explain how the observation is linked to photosynthesis.','PSLE-style · Evidence · 2 marks')
    ]);
    if(has(t,'respiration','activity'))return pack(e,[
      mk('Germinating seeds in Flask P cause a temperature increase, while boiled seeds in Flask Q do not. Both flasks are otherwise identical. Explain the difference.','PSLE-style · Experiment · 3 marks'),
      mk('A small animal is more active in Trial A than Trial B. It uses more oxygen in Trial A. Explain the relationship between activity, respiration and energy.','PSLE-style · Data · 3 marks'),
      mk('A plant is kept in darkness for several hours. Explain why respiration can still occur even though photosynthesis cannot.','PSLE-style · Reasoning · 2 marks')
    ]);
    if(has(t,'stomata','water loss'))return pack(e,[
      mk('Four similar leaves are treated differently: no coating, upper surface coated, lower surface coated, both surfaces coated. The leaf with both surfaces coated loses the least mass. Explain how the result is related to stomata and water loss.','PSLE-style · Data · 3 marks'),
      mk('A desert plant has fewer exposed stomata than a rainforest plant. Explain how this feature can help it survive dry conditions.','PSLE-style · Adaptation · 2 marks'),
      mk('A pupil wants to compare water loss from the upper and lower surfaces of a leaf. State one variable that must be kept the same for a fair comparison.','PSLE-style · Fair test · 2 marks')
    ]);
    return pack(e,[
      mk(`A pupil observes a plant under two different conditions and records a change related to ${e.topic.toLowerCase()}. Explain the change using the relevant plant process.`,'PSLE-style · Application · 2 marks'),
      mk(`Design one simple comparison that could provide evidence for ${e.topic.toLowerCase()}. State what you would observe or measure.`,'PSLE-style · Investigation · 3 marks'),
      mk(`Predict what would happen if the plant structure or process involved in ${e.topic.toLowerCase()} were disrupted. Explain why.`,'PSLE-style · Prediction · 2 marks')
    ]);
  }

  function ecology(e,t){
    if(has(t,'population','predator','prey','food chain','food web','producer'))return pack(e,[
      mk('In a grassland food chain, grass → grasshopper → frog → snake. After many snakes are removed, the number of frogs increases. Predict one likely change in the grasshopper population and explain your answer using the food chain.','PSLE-style · Food web reasoning · 3 marks'),
      mk('A field has 120 rabbits in June and 165 in July. During that month, births and movement into the field were greater than deaths and movement out. Explain the increase in population size.','PSLE-style · Data · 2 marks'),
      mk('A disease greatly reduces the producer population in a food web. Explain why populations further along the food web may also decrease.','PSLE-style · Cause-effect · 3 marks')
    ]);
    if(has(t,'competition','less light'))return pack(e,[
      mk('Seedlings are grown at different densities. Plot P has 10 seedlings and average mass 12 g; Plot Q has 40 seedlings and average mass 5 g. Both plots have the same area, water and light. Explain the difference in average mass.','PSLE-style · Data · 3 marks'),
      mk('Two plants growing very close together have overlapping roots and leaves. State two resources they may compete for and explain how this could affect growth.','PSLE-style · Application · 3 marks'),
      mk('A tall plant shades a shorter plant. Predict how the shorter plant\'s food production may change and explain why.','PSLE-style · Prediction · 2 marks')
    ]);
    if(has(t,'adapt','camouflage','migration','hibernation','group behaviour','body covering','feeding','leaf adaptations','storage','aerial roots'))return pack(e,[
      mk('Two insects live on dark tree bark. Insect P is dark brown and Insect Q is bright yellow. Birds find Q more often. Explain how the difference in appearance can affect survival and reproduction.','PSLE-style · Evidence · 3 marks'),
      mk(`An organism has a feature related to ${e.topic.toLowerCase()}. Explain the chain: feature → how it works → survival or reproduction advantage.`,'PSLE-style · Adaptation chain · 3 marks'),
      mk('A habitat becomes much drier for several months. Suggest one structural or behavioural feature that could help an organism survive and explain how it helps.','PSLE-style · Novel context · 3 marks')
    ]);
    if(has(t,'deforestation','global warming','resource','pollution','environment'))return pack(e,[
      mk('After part of a forest is cleared, the number of nesting sites and food plants decreases. A bird population falls over the next year. Explain how the environmental change could cause the population decrease.','PSLE-style · Data interpretation · 3 marks'),
      mk('A town reduces the amount of waste sent to landfill by reusing and recycling more materials. Explain how this can help conserve natural resources.','PSLE-style · Application · 2 marks'),
      mk('Carbon dioxide concentration in the atmosphere rises over many years. Explain one chain of effects that can contribute to higher global temperatures and changes in sea level.','PSLE-style · Cause-effect · 3 marks')
    ]);
    return pack(e,[
      mk(`A change occurs in a habitat that affects ${e.topic.toLowerCase()}. Predict one effect on organisms in the habitat and explain the link.`,'PSLE-style · Ecology reasoning · 2 marks'),
      mk(`State one observation that would provide evidence for the ecological idea involved in ${e.topic.toLowerCase()}.`,'PSLE-style · Evidence · 2 marks'),
      mk(`Explain how a change in one part of an ecosystem could indirectly affect another population through ${e.topic.toLowerCase()}.`,'PSLE-style · Transfer · 3 marks')
    ]);
  }

  function matter(e,t){
    if(has(t,'evaporation'))return pack(e,[
      mk('Three equal volumes of water are left for 2 hours. P: 25°C, wide dish, still air → 18 mL lost. Q: 25°C, narrow cup, still air → 7 mL lost. R: 25°C, wide dish, fan blowing → 31 mL lost. Use the data to identify two factors that affect evaporation and explain each comparison.','PSLE-style · Data · 4 marks'),
      mk('A pupil wants to investigate only the effect of temperature on evaporation. State two variables that should be kept the same and what should be measured.','PSLE-style · Fair test · 3 marks'),
      mk('Wet clothes dry faster on a warm windy day than on a cool still day. Explain the observation using factors affecting evaporation.','PSLE-style · Real-world transfer · 3 marks')
    ]);
    if(has(t,'condensation','droplets'))return pack(e,[
      mk('A dry metal cup containing ice water is left on a table. Droplets later appear on the outside even though the cup does not leak. Explain where the droplets came from and how they formed.','PSLE-style · Explanation · 3 marks'),
      mk('Two identical cups are placed in the same room. P contains ice water and Q contains warm water. More droplets form outside P. Explain the difference.','PSLE-style · Compare · 3 marks'),
      mk('A pupil wipes the outside of a cold bottle dry, but droplets reappear. What evidence does this provide about the source of the water?','PSLE-style · Evidence · 2 marks')
    ]);
    if(has(t,'melting','freezing','boiling'))return pack(e,[
      mk('A substance is heated and its temperature remains at 60°C for several minutes while it changes state. Explain why the temperature can remain constant during the change.','PSLE-style · Graph reasoning · 2 marks'),
      mk(`A pupil observes ${e.topic.toLowerCase()} while measuring temperature every minute. State the state change involved and whether the substance gains or loses heat.`,'PSLE-style · Data interpretation · 2 marks'),
      mk('Two equal samples of the same substance start at the same temperature. One is heated more strongly. Predict what will happen to the time taken to reach its change-of-state temperature and explain.','PSLE-style · Prediction · 2 marks')
    ]);
    if(has(t,'air occupies','air can be compressed'))return pack(e,[
      mk('A syringe containing trapped air has its nozzle sealed. The plunger can be pushed inward but springs partly back when released. What property of air is shown? Explain using the space occupied by the trapped air.','PSLE-style · Observation · 2 marks'),
      mk('A tissue is placed at the bottom of an inverted cup and pushed straight down into water. The tissue stays dry. Explain why water did not enter the cup fully.','PSLE-style · Novel context · 2 marks'),
      mk('A pupil pushes the same amount of trapped air into a smaller volume. Predict what happens to the space occupied by the air and state the property demonstrated.','PSLE-style · Prediction · 2 marks')
    ]);
    if(has(t,'solid','liquid','gas'))return pack(e,[
      mk('Substance P keeps its own shape and volume. Q changes shape to fit its container but keeps the same volume. R spreads to fill the whole container and can be compressed. Identify the states of P, Q and R and justify one choice.','PSLE-style · Properties table · 4 marks'),
      mk('A fixed amount of liquid is poured from a tall cylinder into a wide bowl. Explain what changes and what remains the same.','PSLE-style · Application · 2 marks'),
      mk('A gas is transferred from a small container into a larger sealed container. Explain how its shape and volume differ from those of a solid.','PSLE-style · Compare · 3 marks')
    ]);
    if(has(t,'water cycle'))return pack(e,[
      mk('Water in a closed transparent container is warmed by sunlight. Later, droplets form on the cooler lid and fall back down. Identify the two changes of state and explain how they model part of the water cycle.','PSLE-style · Model · 4 marks'),
      mk('After several hot days, water level in a pond falls. Later, clouds form and rain occurs. Explain how the same water can move through these stages of the water cycle.','PSLE-style · Sequence · 3 marks'),
      mk('A pupil says clouds are made when liquid water evaporates directly into tiny liquid droplets. Correct the statement using the two processes involved.','PSLE-style · Error analysis · 2 marks')
    ]);
    if(has(t,'choosing materials'))return pack(e,[
      mk('Material P is strong, waterproof and a poor conductor of heat. Material Q is strong, conducts heat well and is not waterproof. Choose the better material for a saucepan handle and justify your choice using a relevant property.','PSLE-style · Materials data · 2 marks'),
      mk('A raincoat needs to be flexible and prevent water from passing through. Explain why choosing material only by its colour would be scientifically inappropriate.','PSLE-style · Evaluation · 2 marks'),
      mk('A manufacturer must choose a material for a window, a cooking pot and an electrical plug covering. Explain why different objects require different material properties.','PSLE-style · Application · 3 marks')
    ]);
    if(has(t,'volume'))return pack(e,[
      mk('A foam block floats in water. A pupil wants to determine its volume using a measuring cylinder and a small metal sinker. Describe a valid method and state which volume readings are needed.','PSLE-style · Method · 4 marks'),
      mk('An irregular stone is completely submerged in a measuring cylinder. Water level rises from 45 mL to 68 mL. Determine the stone\'s volume and explain why the method works.','PSLE-style · Data · 2 marks'),
      mk('A pupil says mass and volume are the same property because larger objects often have more mass. Explain why the statement is incorrect.','PSLE-style · Concept distinction · 2 marks')
    ]);
    return pack(e,[
      mk(`A pupil performs an investigation related to ${e.topic.toLowerCase()}. State the observation that would support the relevant property of matter and explain why.`,'PSLE-style · Investigation · 2 marks'),
      mk(`Use a real-life situation to explain the science idea involved in ${e.topic.toLowerCase()}.`,'PSLE-style · Transfer · 2 marks'),
      mk(`A pupil makes an incorrect claim about ${e.topic.toLowerCase()}. State what evidence would be needed to evaluate the claim.`,'PSLE-style · Evaluation · 2 marks')
    ]);
  }

  function light(e,t){
    if(has(t,'shadow'))return pack(e,[
      mk('A lamp, toy and screen are arranged in a straight line. When the toy is 20 cm from the lamp, the shadow is 18 cm wide. When it is 10 cm from the lamp, the shadow is 29 cm wide. The screen position is unchanged. Describe the relationship and explain it.','PSLE-style · Data · 3 marks'),
      mk('A pupil moves a toy closer to the screen while keeping the lamp and screen fixed. Predict how the shadow size changes and explain using the relative positions of lamp, object and screen.','PSLE-style · Prediction · 2 marks'),
      mk('Two shadows of the same object have different sizes. A pupil concludes the objects must be different sizes. Explain why the conclusion is not necessarily correct.','PSLE-style · Evaluation · 2 marks')
    ]);
    if(has(t,'transparent','translucent','opaque'))return pack(e,[
      mk('A light sensor gives these readings behind three sheets: P 92 units, Q 41 units, R 2 units. Classify P, Q and R as transparent, translucent or opaque and explain one classification.','PSLE-style · Data · 4 marks'),
      mk('A bathroom window allows light through but objects behind it cannot be seen clearly. Classify the material and explain your answer.','PSLE-style · Real-world transfer · 2 marks'),
      mk('A pupil tests materials of different thicknesses. Explain why thickness should be kept the same when comparing how much light different materials allow through.','PSLE-style · Fair test · 2 marks')
    ]);
    if(has(t,'travels'))return pack(e,[
      mk('A pupil can see a lamp through three cards only when the holes in all three cards are aligned. Explain how the observation provides evidence about how light travels.','PSLE-style · Evidence · 2 marks'),
      mk('The middle card is moved slightly sideways and the lamp can no longer be seen through the holes. Explain why.','PSLE-style · Cause-effect · 2 marks'),
      mk('A bent opaque tube joins an eye to a light source. Predict whether the source can be seen directly through the tube and explain.','PSLE-style · Prediction · 2 marks')
    ]);
    if(has(t,'reflection','seeing'))return pack(e,[
      mk('A book is not luminous. Trace the path taken by light from a lamp until the book is seen by a pupil.','PSLE-style · Light path · 3 marks'),
      mk('A pupil can see an object around a corner using two mirrors. Explain the role of reflection in allowing the light to reach the pupil\'s eye.','PSLE-style · Novel context · 2 marks'),
      mk('In a completely dark room, a non-luminous toy cannot be seen even when the pupil\'s eyes are open. Explain why.','PSLE-style · Reasoning · 2 marks')
    ]);
    return pack(e,[
      mk(`A pupil uses a lamp, an object and a screen to investigate ${e.topic.toLowerCase()}. State one observation that would provide evidence for the relevant idea about light.`,'PSLE-style · Investigation · 2 marks'),
      mk(`Predict what would happen if one part of a light path were blocked in a situation involving ${e.topic.toLowerCase()}. Explain your answer.`,'PSLE-style · Prediction · 2 marks'),
      mk(`Explain ${e.topic.toLowerCase()} using a ray of light travelling from a source to another object or the eye.`,'PSLE-style · Reasoning · 2 marks')
    ]);
  }

  function heat(e,t){
    if(has(t,'conductor','insulation','utensil'))return pack(e,[
      mk('Equal rods of aluminium, wood and plastic have wax attached at the far end. Their other ends are placed in hot water. The wax on aluminium melts first. Explain what the result shows about the materials.','PSLE-style · Experiment · 3 marks'),
      mk('Two identical cups contain equally hot water. Cup P is wrapped in wool and Cup Q is unwrapped. After 20 minutes, P is warmer. Explain why.','PSLE-style · Data · 2 marks'),
      mk('A saucepan has a metal body and a plastic handle. Explain why the two parts are made from materials with different heat-conduction properties.','PSLE-style · Application · 3 marks')
    ]);
    if(has(t,'expansion','railway','wire','lid','uneven'))return pack(e,[
      mk('A metal bridge has small gaps between sections. On a hot afternoon the gaps become narrower. Explain why the gaps are needed.','PSLE-style · Real-world transfer · 2 marks'),
      mk('Overhead wires are more taut on a cold morning than on a hot afternoon. Explain the observation using expansion and contraction.','PSLE-style · Observation · 2 marks'),
      mk('A tight metal lid is briefly warmed with hot water and becomes easier to remove. Explain why.','PSLE-style · Application · 2 marks')
    ]);
    return pack(e,[
      mk('Two identical beakers contain equal amounts of water. P starts at 80°C and Q at 25°C in the same room. Explain the direction of heat transfer between each beaker and the surroundings.','PSLE-style · Reasoning · 3 marks'),
      mk('A metal spoon at 25°C is placed in soup at 75°C. After some time the spoon is hotter and the soup is slightly cooler. Explain the changes.','PSLE-style · Cause-effect · 3 marks'),
      mk('Two samples of the same material have the same mass but different temperatures. Explain why temperature alone should not be described as the amount of heat energy in the sample.','PSLE-style · Concept distinction · 2 marks')
    ]);
  }

  function electricity(e,t){
    if(has(t,'closed circuit','open circuit','conductor','insulator','bulb parts'))return pack(e,[
      mk('A test circuit contains a cell and bulb with a gap. Materials P, Q and R are placed in the gap. The bulb lights with P and R but not Q. What can be concluded about the electrical properties of the three materials?','PSLE-style · Experiment · 3 marks'),
      mk('A bulb does not light although the cell is new. A pupil finds a small gap between two wires. Explain why the gap prevents the bulb from lighting.','PSLE-style · Diagnosis · 2 marks'),
      mk('A pupil touches one wire to the glass part of a bulb instead of its metal contact. Explain why the bulb may not light.','PSLE-style · Application · 2 marks')
    ]);
    if(has(t,'more batteries','more bulbs','parallel','short circuit'))return pack(e,[
      mk('Circuit P has one bulb and one cell. Circuit Q has the same bulb with two cells connected appropriately in series. The bulb in Q is brighter. Explain the observation.','PSLE-style · Compare · 2 marks'),
      mk('Circuit A has one bulb. Circuit B has two identical bulbs in series with the same cells. Explain why each bulb in B is dimmer than the bulb in A.','PSLE-style · Reasoning · 2 marks'),
      mk('Two lamps are on separate branches of a parallel circuit. One branch is opened but the other lamp stays lit. Explain why.','PSLE-style · Circuit reasoning · 2 marks')
    ]);
    if(has(t,'electromagnet'))return pack(e,[
      mk('An electromagnet is tested with different numbers of coil turns. 20 turns lift 4 paper clips, 40 turns lift 8, and 60 turns lift 12. State the relationship and explain how the electromagnet can be made stronger.','PSLE-style · Data · 3 marks'),
      mk('The switch in an electromagnet circuit is opened and all paper clips fall off the iron core. Explain why.','PSLE-style · Cause-effect · 2 marks'),
      mk('A pupil wants to test only the effect of number of batteries on electromagnet strength. State two variables that should be kept the same.','PSLE-style · Fair test · 2 marks')
    ]);
    return pack(e,[
      mk('Magnet P attracts a paper clip from 6 cm away while Magnet Q attracts it only from 2 cm away. Which magnet is stronger? Give evidence from the results.','PSLE-style · Data · 2 marks'),
      mk('Two bar magnets are brought together. In one orientation they repel; after one is turned around they attract. Explain the observations using magnetic poles.','PSLE-style · Reasoning · 2 marks'),
      mk('A magnet attracts a steel clip through a sheet of cardboard. Explain what this shows about magnetic force and the cardboard.','PSLE-style · Novel context · 2 marks')
    ]);
  }

  function energyForces(e,t){
    if(has(t,'friction'))return pack(e,[
      mk('A toy car is released from the same ramp onto three surfaces. It travels 140 cm on smooth plastic, 92 cm on wood and 43 cm on rough cloth. Describe the relationship between surface roughness and distance travelled, and explain it using friction and energy.','PSLE-style · Data · 4 marks'),
      mk('A pupil adds the same load to a block and finds a larger force is needed to pull it at steady speed. Explain why.','PSLE-style · Experiment · 2 marks'),
      mk('Oil is added between moving machine parts. Explain how this can affect friction and the amount of energy converted to heat.','PSLE-style · Application · 2 marks')
    ]);
    if(has(t,'kinetic','gravitational potential','elastic potential','rising','falling','conservation'))return pack(e,[
      mk('The same toy car is released from heights of 10 cm, 20 cm and 30 cm on the same ramp. It travels farther after being released from greater heights. Explain the result using energy changes.','PSLE-style · Data · 3 marks'),
      mk('A stretched rubber band launches a paper ball. Explain the energy conversion from before release until the ball is moving.','PSLE-style · Energy conversion · 2 marks'),
      mk('A roller-coaster car slows as it climbs and speeds up as it descends. Explain the changes in kinetic and gravitational potential energy.','PSLE-style · Novel context · 3 marks')
    ]);
    if(has(t,'solar','wind turbine','fuel','hydro','chemical potential'))return pack(e,[
      mk('A solar calculator works in bright light but stops when its panel is covered. State the main energy conversion that allows it to operate.','PSLE-style · Application · 2 marks'),
      mk('Water stored high behind a dam is released and turns a turbine connected to a generator. Describe the sequence of energy conversions.','PSLE-style · Sequence · 3 marks'),
      mk('A battery-powered torch is switched on. Trace the useful energy changes from the battery to the light produced.','PSLE-style · Energy chain · 3 marks')
    ]);
    if(has(t,'gravity','mass and weight'))return pack(e,[
      mk('An astronaut has the same mass on Earth and the Moon but a smaller weight on the Moon. Explain the difference between mass and weight.','PSLE-style · Novel context · 3 marks'),
      mk('Two objects at the same place have masses of 1 kg and 3 kg. Predict which experiences the greater gravitational force from Earth and explain.','PSLE-style · Prediction · 2 marks'),
      mk('A ball thrown upward slows, stops momentarily, then falls. Explain the role of gravitational force throughout the motion.','PSLE-style · Motion reasoning · 3 marks')
    ]);
    if(has(t,'spring'))return pack(e,[
      mk('The same spring is stretched by 2 cm, 4 cm and 6 cm. A force meter shows larger restoring forces at larger extensions. State the relationship and explain what happens when the spring is released.','PSLE-style · Data · 3 marks'),
      mk('Two springs are stretched by the same distance. Spring P pulls back with a larger force than Spring Q. What can be concluded about their stiffness?','PSLE-style · Compare · 2 marks'),
      mk('A compressed spring launches a toy car. Describe the force and energy changes from the compressed spring to the moving car.','PSLE-style · Transfer · 3 marks')
    ]);
    return pack(e,[
      mk('A moving ball is kicked from the side and changes direction. State what this observation shows about the effect of a force.','PSLE-style · Observation · 2 marks'),
      mk('A trolley is initially at rest. A constant push is applied and it begins to move. Explain how the force changes the trolley\'s motion.','PSLE-style · Cause-effect · 2 marks'),
      mk(`A pupil investigates ${e.topic.toLowerCase()} using repeated trials. State one measurement that could provide evidence for the effect being studied.`,'PSLE-style · Investigation · 2 marks')
    ]);
  }

  function rich(e){
    const c=lc(e.category),t=lc(e.topic);
    if(c.includes('diversity'))return diversity(e,t);
    if(c.includes('plant structures'))return plantStructures(e,t);
    if(c.includes('life cycles'))return lifeCycles(e,t);
    if(c.includes('human'))return humanSystems(e,t);
    if(c.includes('plant transport'))return plantProcesses(e,t);
    if(c.includes('ecology'))return ecology(e,t);
    if(c.includes('matter'))return matter(e,t);
    if(c==='light'||c.includes('light'))return light(e,t);
    if(c.includes('heat'))return heat(e,t);
    if(c.includes('electricity'))return electricity(e,t);
    if(c.includes('energy'))return energyForces(e,t);
    return pack(e,[
      mk(`Apply the science idea about ${e.topic.toLowerCase()} to an unfamiliar situation. State the relevant evidence and explain the result.`,'PSLE-style · Transfer · 2 marks'),
      mk(`A pupil designs an investigation about ${e.topic.toLowerCase()}. State one variable to change, one result to measure and one variable to keep the same.`,'PSLE-style · Inquiry · 3 marks'),
      mk(`A pupil makes a claim about ${e.topic.toLowerCase()}. State what evidence would be needed before accepting the claim and explain why.`,'PSLE-style · Evaluation · 2 marks')
    ]);
  }

  function dedup(arr){
    const seen=new Set();
    return arr.filter(v=>{
      const k=lc(v?.question).replace(/\s+/g,' ').trim();
      if(!k||seen.has(k))return false;
      seen.add(k);return true;
    });
  }

  BANK.forEach(e=>{
    const old=Array.isArray(e.applicationVariants)?e.applicationVariants:[];
    const worthwhile=old.filter(v=>!['Reworded','Precision'].includes(v.kind));
    let merged=dedup([...rich(e),...worthwhile]);
    while(merged.length<6&&old.length)merged=dedup([...merged,...old]);
    e.applicationVariants=merged.slice(0,6);
  });

  const style=document.createElement('style');
  style.textContent='#appQuestion{white-space:pre-line}.psle-style-note{margin:10px 0;padding:9px 11px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;color:#1e3a8a;font-size:12px;line-height:1.45}';
  document.head.appendChild(style);
  const pane=document.getElementById('appPane');
  if(pane&&!document.getElementById('psleStyleNote')){
    const note=document.createElement('div');note.id='psleStyleNote';note.className='psle-style-note';
    note.innerHTML='<b>PSLE-style challenge:</b> these are original questions modelled on the current PSLE emphasis on structured application, data/experiment interpretation, scientific inquiry and reasoning. They do not reproduce national examination questions.';
    const q=document.getElementById('appQuestion');if(q)q.insertAdjacentElement('beforebegin',note);
  }
  const sub=document.querySelector('header .sub');
  if(sub)sub.innerHTML='<b>180 re-audited Science concepts</b> · PSLE-style structured application · experiments/data/reasoning · adaptive retrieval + remediation';
  window.PSLE_STYLE_QUESTIONS={installed:true,version:'20260905a'};
  try{render()}catch(_e){}
}
start();
})();
