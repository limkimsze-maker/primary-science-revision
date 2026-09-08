(()=>{
window.APP_VARIANTS=window.APP_VARIANTS||{};
const V=window.APP_VARIANTS;
const put=(id,items)=>{V[id]=items.map(x=>({q:x.q,k:x.k||'Transfer',model:x.model||''}))};

// Audited against the linked book-backed concept and the recurring reasoning patterns
// in the 10 uploaded P6 prelim papers. These are original PSLE-style training questions,
// not reproduced national examination questions. Only question/model wording is changed;
// pupil progress is never read, reset or rewritten here.

put(1,[
 {q:'A puppy grows, needs food and water, and reproduces. A toy robot can move but does not show these other characteristics. Using the observations, explain why movement alone is not enough to decide that something is living.',k:'Evidence',model:'Living things need air, food and water, grow, reproduce and respond to changes around them. Movement alone is not enough to show that something is living.'},
 {q:'A dormant seed does not appear to move. State other characteristics that can be used to decide whether something is living.',model:'Living things need air, food and water, grow, reproduce and respond to changes around them.'}
]);

put(11,[
 {q:'All the flowers on a flowering plant are removed before pollination and fertilisation can occur. Explain how this can affect the formation of fruits and seeds.',k:'Transfer',model:'If the flowers are removed before pollination and fertilisation can occur, fruits and seeds cannot form from those flowers.'},
 {q:'Explain how flowers are involved in reproduction in a flowering plant.',k:'Transfer',model:'Flowers enable flowering plants to reproduce.'}
]);

put(31,[
 {q:'After fertilisation, explain what the ovary and ovules develop into.',model:'After fertilisation, the ovary develops into a fruit and the ovules develop into seeds.'},
 {q:'A pupil says that after fertilisation the ovary becomes a seed. Correct the statement and explain what happens to the ovary and ovules.',model:'After fertilisation, the ovary develops into a fruit and the ovules develop into seeds.'}
]);
put(33,[
 {q:'Explain how the testes and ovaries have different reproductive functions in humans.',k:'Compare',model:'The testes produce sperm or male reproductive cells, while the ovaries produce eggs or female reproductive cells.'},
 {q:'A diagram labels the testes and ovaries. State the reproductive cell produced by each organ.',k:'Diagram',model:'The testes produce sperm cells, while the ovaries produce egg cells.'}
]);
put(35,[
 {q:'Explain the role of the womb after fertilisation in humans.',model:'The fertilised egg develops in the womb.'},
 {q:'A pupil says the developing baby grows in the ovary. Correct the statement using the correct organ.',model:'The fertilised egg develops in the womb.'}
]);

put(42,[
 {q:"After running, a pupil's breathing rate rises. Explain why the body needs this change.",model:'During exercise, the body needs more energy, so respiration occurs faster. More oxygen is needed and carbon dioxide must be removed faster, so breathing rate increases.'},
 {q:"A resting pupil begins vigorous exercise. Explain why the pupil's breathing rate increases, referring to energy, respiration and oxygen.",model:'During exercise, the body needs more energy, so respiration occurs faster. More oxygen is needed and carbon dioxide must be removed faster, so breathing rate increases.'},
 {q:'After exercise stops, the body needs less energy. Predict what happens to breathing rate after a while and explain.',model:'As the body needs less energy, the rate of respiration decreases, so less oxygen is needed and breathing rate decreases towards the resting rate.'}
]);
put(46,[
 {q:"A pupil's heart rate increases while running. Explain how this helps the working muscles.",model:'During exercise, the heart beats faster so that oxygen and digested food reach the muscles faster and carbon dioxide and waste materials are removed faster.'},
 {q:"During exercise, a pupil's heart rate increases. Explain how this helps the working muscles and helps remove carbon dioxide.",model:'During exercise, the heart beats faster so that oxygen and digested food reach the muscles faster and carbon dioxide and waste materials are removed faster.'}
]);
put(49,[
 {q:'Undigested food passes into the large intestine. Explain the main role of the large intestine.',model:'The large intestine absorbs water from undigested food.'},
 {q:'A pupil says most digested food is absorbed in the large intestine. Correct the statement and state the main role of the large intestine.',model:'Most digested food is absorbed in the small intestine. The large intestine absorbs water from undigested food.'}
]);

put(58,[
 {q:'Food-carrying tubes are damaged below the leaves. Explain why roots and other parts below the damage may receive less food.',model:'Food made in the leaves cannot pass through the damaged food-carrying tubes to parts below the damage.'},
 {q:'A ring of food-carrying tissue is removed from a plant stem. After several days, food accumulates above the damaged region. Explain why.',model:'Food made in the leaves cannot pass through the damaged food-carrying tubes to parts below, so it may accumulate above the damage.'}
]);
put(61,[
 {q:'During respiration in a plant, explain how oxygen and carbon dioxide move through the stomata.',model:'During respiration, oxygen enters the leaf and carbon dioxide leaves through the stomata.'},
 {q:'A living plant is respiring. State which gas enters and which gas leaves through the stomata.',model:'During respiration, oxygen enters the leaf and carbon dioxide leaves through the stomata.'}
]);
put(63,[
 {q:'A leaf makes more sugar than the plant immediately needs. Explain what can happen to the excess sugar.',model:'Excess sugar made during photosynthesis may be stored as starch.'}
]);

put(75,[
 {q:'A floating sheet blocks much of the light reaching a submerged plant. Explain why the plant may eventually die.',model:'When a plant receives less light, less photosynthesis takes place, less food is made and the plant may eventually die.'},
 {q:"A plant is moved from bright light to deep shade. Explain how this can affect photosynthesis, food production and the plant's growth.",model:'With less light, less photosynthesis takes place, so less food is made and the plant may grow poorly or eventually die.'}
]);
put(77,[
 {q:'A plant living in a dry habitat has thick, fleshy leaves that store water. Explain how this feature can help the plant survive when water is scarce.',k:'Transfer',model:'The thick, fleshy leaves store water that can be used when water is scarce, helping the plant survive.'},
 {q:'An animal has a body feature that makes it difficult for predators to see. Explain how the feature can improve its chance of survival.',k:'Transfer',model:'The feature makes the animal less easily seen by predators, reducing its chance of being eaten and improving its chance of survival.'}
]);
put(78,[
 {q:'A forest is cleared for construction. Explain how this can affect animals that depended on the forest for food and shelter.',model:'Deforestation destroys habitats and reduces food and shelter, so animal populations may decrease.'},
 {q:'After part of a forest is cleared, animals have fewer places to shelter and less food. Explain why their population may decrease.',model:'With less food and shelter available, fewer animals may survive and reproduce, so the population may decrease.'}
]);
put(79,[
 {q:'Atmospheric carbon dioxide increases over many years. Explain how this can contribute to melting ice and rising sea level.',model:'Increased carbon dioxide can increase heat trapping, contributing to global warming. Higher temperatures can melt ice and contribute to rising sea levels.'},
 {q:'Atmospheric carbon dioxide increases. Explain the chain of effects that can lead to rising sea level.',model:'Increased carbon dioxide can increase heat trapping, contributing to global warming, melting ice and rising sea levels.'}
]);
put(82,[
 {q:'A pond contains populations of fish, frogs, plants and insects living together. Explain why these populations form a community.',model:'A community consists of different populations living together in the same habitat.'}
]);
put(83,[
 {q:"A plant's growth is affected by light, water and nearby insects. Compare these environmental factors by identifying which are living and which are non-living.",k:'Compare',model:'The nearby insects are living factors, while light and water are non-living factors.'}
]);
put(84,[
 {q:'Several food chains in the same habitat share organisms and are linked together. Explain why they form a food web.',model:'A food web is formed from interconnected food chains.'}
]);
put(85,[
 {q:'A thick fur coat and migration are both adaptations. Explain why the fur coat is a structural adaptation while migration is a behavioural adaptation.',k:'Compare',model:'A thick fur coat is a structural adaptation because it is a physical feature of the body, while migration is a behavioural adaptation because it is an action carried out by the animal.'}
]);
put(95,[
 {q:'Waste from human activities enters a pond and changes the water conditions. Explain how this environmental change can affect organisms living in the pond.',model:'Pollution can change water conditions and harm organisms and their habitat.'},
 {q:'Waste enters a pond and changes the water conditions. Explain how pollution can affect organisms living there.',model:'Pollution can change water conditions and harm organisms living in the pond.'}
]);

put(99,[
 {q:'A wooden block is moved from a tray to a box but keeps the same shape and volume. Explain what this observation shows about solids.',k:'Evidence',model:'A solid has a definite shape and a definite volume.'}
]);
put(100,[
 {q:'Water is poured from a bottle into a bowl. It changes shape but keeps the same volume. Explain what this shows about liquids.',k:'Evidence',model:'A liquid has no definite shape but has a definite volume and takes the shape of its container.'}
]);
put(101,[
 {q:'Air fills containers of different shapes and can be compressed. Explain what these observations show about gases.',k:'Evidence',model:'A gas has no definite shape and no definite volume and can be compressed.'}
]);
put(109,[
 {q:'Two identical wet cloths are placed at different temperatures. Predict which dries faster and explain using evaporation rate.',model:'The cloth at the higher temperature dries faster because a higher temperature increases the rate of evaporation.'},
 {q:'A pupil investigates how temperature affects the rate of evaporation. State what should be changed, what should be measured, and two variables that should be kept the same.',k:'Experiment',model:'Change the temperature and measure the amount of water lost in a fixed time or the time taken for a fixed amount to evaporate. Keep relevant variables such as the initial amount of water, exposed surface area and moving air the same.'}
]);
put(113,[
 {q:"A stone is fully submerged in a measuring cylinder. The water level rises from 45 mL to 68 mL. Explain how the readings can be used to find the volume of the stone.",k:'Evidence',model:'The stone displaces a volume of water equal to its own volume. Its volume is 68 mL - 45 mL = 23 mL, which is 23 cm³.'},
 {q:'An irregular stone raises the water level in a measuring cylinder. What quantity of the stone can be found from the change in water level?',model:'The change in water level gives the volume of the stone.'}
]);

put(114,[
 {q:'A pupil can see a book only after a lamp is switched on. Explain what this shows about light.',k:'Evidence',model:'Light is a form of energy that enables us to see.'},
 {q:'A solar panel receives light from the Sun. Before any conversion occurs, what form of energy is arriving at the panel?',model:'Light energy.'}
]);
put(119,[
 {q:'Frosted glass allows some light through, but objects behind it cannot be seen clearly. Explain why it is classified as translucent.',model:'Translucent materials allow some light to pass through.'}
]);

put(128,[
 {q:'Two samples of the same substance are at the same temperature, but one sample has a greater mass. Explain why the two samples may contain different amounts of heat energy.',k:'Compare',model:'The amount of heat energy in a substance depends on factors including its temperature and the amount of substance. The samples have the same temperature but different amounts of substance.'}
]);
put(133,[
 {q:'A metal rod is heated and later cooled. Explain how its size changes in each case.',model:'Matter generally expands when heated and contracts when cooled.'}
]);
put(138,[
 {q:"A heater transfers energy to a cooler object and the object's temperature rises. Explain why heat is involved in this change.",model:'Heat is a form of energy that can cause the temperature of an object to change.'}
]);
put(139,[
 {q:'A thermometer reads 35°C for one object and 20°C for another. Explain what the thermometer readings tell us.',k:'Compare',model:'Temperature is a measure of how hot or cold an object is. The 35°C object has a higher temperature than the 20°C object.'}
]);

put(151,[
 {q:'Two electromagnets are identical except that Electromagnet P has more turns of wire around its iron core than Q. Compare their strengths and explain.',k:'Compare',model:'Electromagnet P is stronger because increasing the number of turns of wire around an iron core can make an electromagnet stronger.'},
 {q:'A pupil investigates how the number of turns of wire affects electromagnet strength. State the changed variable, the measured variable and two variables that should be kept the same.',k:'Experiment',model:'The changed variable is the number of turns of wire. The measured variable is the strength of the electromagnet, for example the number of paper clips lifted. Keep relevant variables such as the number of batteries, the iron core and the wire type the same.'}
]);
put(158,[
 {q:'Explain two methods by which a magnetic material can be made into a magnet.',model:'A magnet can be made by stroking a magnetic material with a magnet or by using electricity to form an electromagnet.'}
]);

put(160,[
 {q:'A solar panel powers a small device in sunlight. Explain the energy conversion that occurs in the solar panel.',model:'A solar panel converts light energy into electrical energy.'}
]);
put(161,[
 {q:'Moving air turns wind-turbine blades and electricity is produced. Explain the energy conversion.',model:'A wind turbine converts the kinetic energy of moving air into electrical energy.'}
]);
put(162,[
 {q:'Fuel burns and produces heat and light. Explain how the stored energy in the fuel changes form.',model:'Stored chemical potential energy in the fuel is converted into heat energy and light energy.'}
]);
put(164,[
 {q:'Two moving objects have different masses and speeds. Explain which two factors affect their kinetic energy.',model:'The kinetic energy of a moving object depends on its mass and speed.'}
]);
put(166,[
 {q:'A stretched rubber band is released and launches an object. Explain the energy change from before release until the object is moving.',model:'The stretched rubber band stores elastic potential energy, which is converted into kinetic energy when it is released.'}
]);
put(169,[
 {q:'A ball thrown upward slows as it rises and speeds up as it falls. Explain the main energy conversions during the upward and downward motion.',model:'As the ball rises, kinetic energy is converted into gravitational potential energy. As it falls, gravitational potential energy is converted into kinetic energy.'}
]);
put(180,[
 {q:'Food and batteries can both supply energy. Explain what form of stored energy they contain.',model:'Food and batteries contain stored chemical potential energy.'}
]);

window.PSLE_AUDITED_FRAMEWORK_OVERRIDES={installed:true,version:'20260908-audit1',ids:[1,11,31,33,35,42,46,49,58,61,63,75,77,78,79,82,83,84,85,95,99,100,101,109,113,114,119,128,133,138,139,151,158,160,161,162,164,166,169,180]};
})();
