"use strict";

(function initializeAstralAcademy() {
    const constellations = [
        { id: "Orion", season: "Winter (Northern Hemisphere) · summer (Southern)", visibility: "Visible in both hemispheres; high in the north's winter and the south's summer.", shape: "Look for three evenly spaced belt stars between bright blue-white Rigel and reddish Betelgeuse.", fact: "The Orion Nebula (M42) is a nearby stellar nursery visible to the unaided eye as a fuzzy patch below the Belt.", deepSky: "Orion Nebula (M42), the Horsehead Nebula (B33; telescope/photography)", steps: ["Find the three Belt stars in a short, straight row.", "Trace the four bright corner stars around the Belt.", "Use orange Betelgeuse and blue-white Rigel to orient the figure."], lines: [["Betelgeuse", "Bellatrix"], ["Bellatrix", "Mintaka"], ["Mintaka", "Alnilam"], ["Alnilam", "Alnitak"], ["Alnitak", "Saiph"], ["Saiph", "Rigel"], ["Rigel", "Mintaka"], ["Betelgeuse", "Alnitak"]] },
        { id: "Ursa Major", season: "Circumpolar for much of the Northern Hemisphere; spring is excellent.", visibility: "Northern latitudes; not visible from most of the Southern Hemisphere.", shape: "Recognise the Big Dipper: a four-star bowl with a three-star handle. It is an asterism inside Ursa Major.", fact: "The Big Dipper is only part of Ursa Major. Mizar has a naked-eye companion, Alcor, under good conditions.", deepSky: "Pinwheel Galaxy (M101), Bode's Galaxy (M81), Cigar Galaxy (M82)", steps: ["Find the four stars forming the Dipper's bowl.", "Follow the three handle stars away from the bowl.", "Use Dubhe and Merak on the bowl's outer edge as pointers to Polaris."], lines: [["Dubhe", "Merak"], ["Merak", "Phecda"], ["Phecda", "Megrez"], ["Megrez", "Dubhe"], ["Megrez", "Alioth"], ["Alioth", "Mizar"], ["Mizar", "Alkaid"]] },
        { id: "Ursa Minor", season: "Circumpolar in the Northern Hemisphere.", visibility: "Northern Hemisphere only; Polaris is too far south to see from most southern latitudes.", shape: "A smaller, fainter dipper. Polaris marks the end of its handle and sits near the north celestial pole.", fact: "Polaris is not the brightest star in the sky. Its small apparent motion makes it a useful north marker.", deepSky: "No bright Messier object; the constellation is useful for orientation.", steps: ["Find the Big Dipper first, then extend its bowl-pointer line.", "The line reaches Polaris, the end of the Little Dipper's handle.", "Look for the fainter bowl stars Kochab and Pherkad nearby."], lines: [["Polaris", "Yildun"], ["Yildun", "Epsilon UMi"], ["Epsilon UMi", "Zeta UMi"], ["Zeta UMi", "Kochab"], ["Kochab", "Pherkad"], ["Pherkad", "Epsilon UMi"]] },
        { id: "Cassiopeia", season: "Autumn is prominent in the Northern Hemisphere; often circumpolar farther north.", visibility: "Northern Hemisphere and much of the equatorial region.", shape: "Five bright stars form a distinctive W or, on the opposite side of the pole, an M.", fact: "Cassiopeia lies across the Milky Way and contains the supernova remnant Cassiopeia A, a strong radio source.", deepSky: "The Double Cluster (NGC 869/884), open cluster M52", steps: ["Look opposite the Big Dipper across Polaris.", "Pick out five bright stars in a zigzag W.", "Use the W's orientation to recognise that the sky's view rotates with the night."], lines: [["Caph", "Schedar"], ["Schedar", "Gamma Cas"], ["Gamma Cas", "Ruchbah"], ["Ruchbah", "Segin"]] },
        { id: "Scorpius", season: "Summer in the Northern Hemisphere · winter in the Southern.", visibility: "Both hemispheres; especially striking in the Southern Hemisphere.", shape: "A hooked curve of stars sweeps from reddish Antares through the body to the curved tail and close pair Shaula and Lesath.", fact: "Antares is a red supergiant; its name means rival of Ares (Mars), whose reddish colour it can resemble.", deepSky: "Globular clusters M4 and M80; open cluster M6", steps: ["Find red Antares in the Scorpion's heart.", "Trace the body toward the southern curve of the tail.", "Look for the close stinger stars Shaula and Lesath at the end."], lines: [["Dschubba", "Antares"], ["Antares", "Tau Sco"], ["Tau Sco", "Epsilon Sco"], ["Epsilon Sco", "Mu Sco"], ["Mu Sco", "Shaula"], ["Shaula", "Sargas"], ["Sargas", "Iota Sco"]] },
        { id: "Leo", season: "Spring in the Northern Hemisphere · autumn in the Southern.", visibility: "Both hemispheres; best placed in the north during spring evenings.", shape: "A backward question-mark sickle outlines the head and mane, with a triangle of stars forming the hindquarters.", fact: "The annual Leonid meteor shower appears to radiate from Leo, though meteors can streak across any part of the sky.", deepSky: "Leo Triplet (M65, M66, NGC 3628), galaxies M95 and M96", steps: ["Find the backwards question-mark curve of the Sickle.", "Bright Regulus marks the bottom of the handle.", "Look east of the Sickle for the triangle ending at Denebola."], lines: [["Regulus", "Eta Leo"], ["Eta Leo", "Algieba"], ["Algieba", "Adhafera"], ["Adhafera", "Rasalas"], ["Regulus", "Zosma"], ["Zosma", "Chertan"], ["Chertan", "Denebola"], ["Denebola", "Zosma"]] },
        { id: "Cygnus", season: "Summer in the Northern Hemisphere · winter in the Southern.", visibility: "Both hemispheres, though the northernmost stars are low from far south.", shape: "The Northern Cross: Deneb at the top, Albireo at the foot, and a crossbar through Sadr.", fact: "Cygnus lies along the Milky Way. Deneb is a very luminous supergiant hundreds of times farther away than nearby bright stars.", deepSky: "North America Nebula (NGC 7000), Veil Nebula (Caldwell 33/34)", steps: ["Find bright Deneb, one corner of the Summer Triangle.", "Trace the long axis through Sadr to Albireo.", "Use the crossbar through Sadr to confirm the Northern Cross."], lines: [["Deneb", "Sadr"], ["Sadr", "Albireo"], ["Sadr", "Gienah"], ["Sadr", "Delta Cyg"]] },
        { id: "Taurus", season: "Winter in the Northern Hemisphere · summer in the Southern.", visibility: "Both hemispheres; high in the north's winter.", shape: "Find the V-shaped Hyades cluster with orange Aldebaran near one eye, then the compact Pleiades nearby.", fact: "Aldebaran appears in the Hyades line of sight but is not a member of that cluster; it is much closer to Earth.", deepSky: "Pleiades (M45), Hyades, Crab Nebula (M1)", steps: ["Find the V-shaped face of the Bull, the Hyades.", "Identify orange Aldebaran near one tip (it is a foreground star).", "Look nearby for the compact, tiny-dipper-like Pleiades."], lines: [["Aldebaran", "Elnath"], ["Aldebaran", "Ain"], ["Ain", "Hyadum II"], ["Elnath", "Zeta Tau"], ["Alcyone", "Taygeta"]] },
        { id: "Gemini", season: "Winter in the Northern Hemisphere · summer in the Southern.", visibility: "Both hemispheres; high in the north's winter.", shape: "Two nearly parallel chains begin at bright Castor and Pollux, the Twins' heads.", fact: "Pollux is an orange giant with a known planet; Castor is a multiple-star system.", deepSky: "Open cluster M35", steps: ["Find bright Pollux and Castor close together.", "Trace two parallel lines of stars down from the pair.", "M35 lies near the foot of the Castor-side twin, best seen with binoculars."], lines: [["Castor", "Wasat"], ["Wasat", "Mebsuta"], ["Mebsuta", "Tejat"], ["Pollux", "Alhena"], ["Alhena", "Wasat"]] },
        { id: "Crux", season: "Autumn in the Southern Hemisphere.", visibility: "Southern Hemisphere; not visible from most of the Northern Hemisphere.", shape: "Four bright stars form a compact cross. The long axis points approximately toward the south celestial pole.", fact: "Crux is the smallest of the 88 modern constellations by area, yet its bright stars make it easy to recognise.", deepSky: "Jewel Box cluster (NGC 4755), Coalsack Nebula", steps: ["Find the compact cross of four bright stars.", "Distinguish it from the nearby False Cross, which is larger and dimmer.", "Extend the long axis about 4.5 times to estimate the south celestial pole."], lines: [["Acrux", "Mimosa"], ["Mimosa", "Delta Crucis"], ["Delta Crucis", "Gacrux"], ["Gacrux", "Acrux"]] }
    ];

    const stars = [
        ["Betelgeuse","Orion",5.9195,7.4071,550,0.42,"M1–M2 Ia","A red supergiant whose size and brightness vary."],
        ["Rigel","Orion",5.2423,-8.2016,860,0.13,"B8 Ia","A blue-white supergiant; its distance is a rounded modern parallax estimate."],
        ["Bellatrix","Orion",5.4189,6.3497,250,1.64,"B2 III","Its name is Latin for female warrior."],
        ["Saiph","Orion",5.7959,-9.6696,650,2.06,"B0.5 Ia","A hot blue supergiant marking Orion's lower-right corner."],
        ["Alnitak","Orion",5.6793,-1.9426,1260,1.77,"O9.5 Iab","The easternmost star of Orion's Belt; a multiple-star system."],
        ["Alnilam","Orion",5.6036,-1.2019,2000,1.69,"B0 Ia","The central Belt star, a luminous blue supergiant."],
        ["Mintaka","Orion",5.5334,-0.2991,1200,2.23,"O9.5 II","The western Belt star; a multiple-star system."],
        ["Dubhe","Ursa Major",11.0621,61.7508,123,1.79,"K0 III","One of the two Big Dipper pointer stars; it is a multiple-star system."],
        ["Merak","Ursa Major",11.0307,56.3824,80,2.37,"A1 IV","Pair it with Dubhe to point toward Polaris."],
        ["Phecda","Ursa Major",11.8972,53.6948,83,2.44,"A0 Ve","A bowl star in the familiar Big Dipper asterism."],
        ["Megrez","Ursa Major",12.2571,57.0326,81,3.31,"A3 V","The faintest of the seven Big Dipper stars joins bowl and handle."],
        ["Alioth","Ursa Major",12.9005,55.9598,83,1.77,"A1 III-IV","The brightest star in Ursa Major by apparent magnitude."],
        ["Mizar","Ursa Major",13.3987,54.9254,83,2.23,"A2 V","A naked-eye test star with Alcor nearby; Mizar itself is a multiple system."],
        ["Alkaid","Ursa Major",13.7923,49.3133,103,1.86,"B3 V","The star at the tip of the Big Dipper's handle."],
        ["Polaris","Ursa Minor",2.5303,89.2641,447,1.98,"F7 Ib","A Cepheid variable that lies close to the north celestial pole."],
        ["Kochab","Ursa Minor",14.8451,74.1555,130,2.08,"K4 III","An orange giant; it and Pherkad were called the Guardians of the Pole."],
        ["Pherkad","Ursa Minor",15.3455,71.8339,487,3.05,"A3 II","A hot giant that forms the Little Dipper's outer bowl."],
        ["Zeta UMi","Ursa Minor",15.7343,77.7945,380,4.32,"A3 V","A fainter star in the Little Dipper's bowl; visibility depends on dark adaptation."],
        ["Epsilon UMi","Ursa Minor",16.7661,82.0373,303,4.21,"F5 V","A modestly bright star along the Little Dipper's handle."],
        ["Yildun","Ursa Minor",17.5369,86.5865,172,4.35,"A1 V","The second star along the Little Dipper's handle from Polaris."],
        ["Caph","Cassiopeia",0.1529,59.1498,55,2.27,"F2 III","A variable giant at one end of Cassiopeia's W."],
        ["Schedar","Cassiopeia",0.6751,56.5373,228,2.24,"K0 IIIa","The orange giant at the traditional heart of the Queen."],
        ["Gamma Cas","Cassiopeia",0.9451,60.7167,550,2.47,"B0.5 IVe","A rapidly rotating, variable Be star."],
        ["Ruchbah","Cassiopeia",1.4303,60.2353,99,2.68,"A5 IV","A bright eclipsing binary in the W pattern."],
        ["Segin","Cassiopeia",1.9066,63.67,440,3.38,"B3 III","The northernmost end star of the familiar W."],
        ["Antares","Scorpius",16.4901,-26.432,550,1.06,"M1.5 Iab","A red supergiant near the Scorpion's heart; its brightness varies."],
        ["Shaula","Scorpius",17.5601,-37.1038,570,1.62,"B2 IV","A hot multiple system at the Scorpion's stinger."],
        ["Lesath","Scorpius",17.5127,-37.2958,580,2.69,"B2 IV","A blue star close to Shaula at the end of the Scorpion's stinger."],
        ["Sargas","Scorpius",17.6219,-42.9978,270,1.87,"F1 II","A bright giant near the sweeping tail."],
        ["Dschubba","Scorpius",16.0056,-22.6217,444,2.32,"B0.2 IV","A multiple star near the Scorpion's forehead."],
        ["Tau Sco","Scorpius",16.5981,-28.216,470,2.82,"B0.2 V","A hot, young star in the Scorpion's body."],
        ["Epsilon Sco","Scorpius",16.8361,-34.293,63,2.29,"K1 III","A nearby orange giant along the Scorpion's curved body."],
        ["Mu Sco","Scorpius",16.8645,-38.047,520,3.00,"B2 IV","A multiple star in the lower curve toward the stinger."],
        ["Regulus","Leo",10.1395,11.9672,79,1.35,"B7 V","A rapidly rotating star near the ecliptic; its name means little king."],
        ["Denebola","Leo",11.8177,14.5721,36,2.14,"A3 V","Its name means tail of the lion."],
        ["Algieba","Leo",10.3328,19.8415,130,2.37,"K1 III","A well-known pair of golden giant stars visible in small telescopes."],
        ["Zosma","Leo",11.2351,20.5237,58,2.56,"A4 V","A nearby white star along the Lion's back."],
        ["Chertan","Leo",11.2373,15.4296,165,3.34,"A2 V","A star on the Lion's hindquarters."],
        ["Eta Leo","Leo",10.1222,16.7627,1300,3.48,"A0 Ib","A distant luminous supergiant in the Sickle's handle."],
        ["Adhafera","Leo",10.2782,23.4173,274,3.43,"F0 III","A multiple-star system along the Lion's mane."],
        ["Rasalas","Leo",9.8794,26.0069,133,3.88,"K2 III","A giant star near the northern edge of the Sickle."],
        ["Deneb","Cygnus",20.6905,45.2803,2600,1.25,"A2 Ia","A luminous blue-white supergiant and one vertex of the Summer Triangle."],
        ["Albireo","Cygnus",19.5120,27.9597,430,3.08,"K3 II","A striking gold-and-blue colour contrast in small telescopes."],
        ["Sadr","Cygnus",20.3705,40.2567,1800,2.23,"F8 Iab","The central crossbar star of the Northern Cross."],
        ["Gienah","Cygnus",20.7702,33.9703,72,2.48,"K0 III","An orange giant that forms one end of the Northern Cross's crossbar."],
        ["Delta Cyg","Cygnus",19.7496,45.1308,170,2.87,"B9.5 III","A multiple system marking the other side of the crossbar."],
        ["Aldebaran","Taurus",4.5987,16.5093,65,0.85,"K5 III","An orange giant that appears in front of, but is not part of, the Hyades."],
        ["Elnath","Taurus",5.4382,28.6075,134,1.65,"B7 III","Marks one of the Bull's horn tips and borders Auriga."],
        ["Alcyone","Taurus",3.7914,24.1051,400,2.87,"B7 III","The brightest member of the Pleiades cluster."],
        ["Zeta Tau","Taurus",5.6274,21.1425,440,3.0,"B2 III","A rapidly rotating Be star near the Crab Nebula's direction."],
        ["Ain","Taurus",4.4769,19.1804,155,3.53,"K0 III","An orange giant in the Hyades line of sight."],
        ["Hyadum II","Taurus",4.3822,17.5425,153,3.77,"G9.5 III","A giant star in the V-shaped Hyades cluster."],
        ["Taygeta","Taurus",3.7532,24.4673,440,4.30,"B6 IV","One of the visible stars in the Pleiades cluster."],
        ["Castor","Gemini",7.5767,31.8883,51,1.58,"A1 V","A multiple-star system whose bright pair is resolvable in small telescopes."],
        ["Pollux","Gemini",7.7553,28.0262,34,1.14,"K0 III","An orange giant with a confirmed planet."],
        ["Alhena","Gemini",6.6285,16.3993,109,1.93,"A1.5 IV","A luminous white star marking one twin's foot."],
        ["Wasat","Gemini",7.3354,21.9823,59,3.53,"F0 IV","A double star close to the ecliptic."],
        ["Mebsuta","Gemini",6.7322,25.1311,840,3.06,"G8 Ib","A distant supergiant in the Castor-side twin."],
        ["Tejat","Gemini",6.3827,22.5136,230,2.88,"M3 III","An orange-red giant marking the foot of the Castor-side twin."],
        ["Acrux","Crux",12.4433,-63.0991,321,0.76,"B0.5 IV","The brightest star in Crux; a multiple-star system."],
        ["Mimosa","Crux",12.7953,-59.6888,280,1.25,"B0.5 III","A blue giant and one arm of the Southern Cross."],
        ["Gacrux","Crux",12.5194,-57.1132,88,1.63,"M3.5 III","A red giant at the top of the Southern Cross."],
        ["Delta Crucis","Crux",12.2524,-58.7489,345,2.79,"B2 IV","The faintest of the four main Southern Cross stars."]
    ].map(([name, constellation, ra, dec, distance, magnitude, spectral, fact]) => ({
        name, constellation, ra, dec, distance, magnitude, spectral, fact
    }));

    const planets = [
        { name: "Mercury", period: "88 Earth days", fact: "The smallest planet, often lost in twilight because it stays close to the Sun in our sky.", tip: "Look low near the eastern horizon before sunrise or western horizon after sunset; never scan near the Sun with optics." },
        { name: "Venus", period: "225 Earth days", fact: "The brightest planet as seen from Earth and covered by highly reflective clouds.", tip: "A brilliant, steady evening or morning object. It never appears far from the Sun." },
        { name: "Mars", period: "687 Earth days", fact: "Its iron-oxide-rich surface gives it a distinctive ruddy colour.", tip: "Compare its position to nearby stars over several nights; its apparent brightness changes substantially with distance." },
        { name: "Jupiter", period: "11.86 Earth years", fact: "A gas giant with a powerful magnetic field and a family of large moons.", tip: "Often a bright, steady point. Binoculars held steadily may show its four largest moons." },
        { name: "Saturn", period: "29.45 Earth years", fact: "Its spectacular rings are made mostly of water-ice particles.", tip: "It looks star-like to the unaided eye; even a small telescope can reveal its rings when geometry permits." },
        { name: "Uranus", period: "84.0 Earth years", fact: "An ice giant with an extreme axial tilt; it is near the naked-eye limit under very dark skies.", tip: "Use a current chart and binoculars or a telescope; do not identify it by colour alone." },
        { name: "Neptune", period: "164.8 Earth years", fact: "The most distant recognised planet, discovered through mathematical prediction and telescopic observation.", tip: "Requires a telescope and a reliable finder chart; it is not a naked-eye planet." }
    ];

    const lessons = [
        { id: "twinkle", title: "Why stars twinkle", simple: "Turbulent air bends starlight from moment to moment, making a point-like star flicker in brightness and position.", science: "Atmospheric refraction changes along the line of sight as air with different temperatures and densities moves. Planets' small apparent disks average out some of these fluctuations, so they often look steadier.", prompt: "Move the atmosphere slider to change how turbulent air is.", visual: "Atmospheric shimmer" },
        { id: "navigation", title: "Finding north with Polaris", simple: "The Big Dipper's pointer stars lead to Polaris, which lies close to the north celestial pole.", science: "The north celestial pole is the point where Earth's rotation axis meets the celestial sphere. Polaris is currently near that point, so its altitude approximately matches the observer's latitude in the Northern Hemisphere.", prompt: "Move the pointer slider to trace the line toward Polaris.", visual: "North-star pointer" },
        { id: "motion", title: "Why the sky moves", simple: "Earth rotates eastward, so stars appear to sweep westward across the sky during the night.", science: "Earth rotates once relative to distant stars in about 23 h 56 min. The apparent daily motion is westward around the celestial poles; stars near a pole can remain above the horizon.", prompt: "Move the time slider to trace the apparent westward drift.", visual: "Earth's rotation" },
        { id: "circumpolar", title: "Circumpolar stars", simple: "Some stars circle a celestial pole without dipping below the horizon. Which stars do this depends on your latitude.", science: "In the Northern Hemisphere, stars with declination greater than 90° minus the observer's latitude are circumpolar; the analogous southern rule applies around the south celestial pole.", prompt: "Move the slider to follow a star around the pole.", visual: "Circumpolar path" },
        { id: "objects", title: "Stars, planets, satellites & aircraft", simple: "A star or planet stays nearly fixed relative to nearby stars over minutes. Satellites cross steadily; aircraft usually show coloured, flashing navigation lights.", science: "A planet's nightly motion is gradual against the stellar background. Low-Earth-orbit satellites move across the field over minutes and often shine by reflected sunlight; aircraft have repeating anti-collision lights. A single clue is not conclusive.", prompt: "Move the slider to compare a slow satellite crossing with a fixed star.", visual: "Moving sky objects" },
        { id: "coordinates", title: "Celestial coordinates", simple: "Right ascension and declination locate objects on the celestial sphere, like longitude and latitude projected onto the sky.", science: "Equatorial coordinates are tied to Earth's equator and pole and are nearly fixed for stars. Local altitude and azimuth depend on the observer's location and time; this chart does not convert to a local horizon.", prompt: "Rotate the coordinate grid to explore the equatorial frame.", visual: "RA · Dec grid" },
        { id: "seasons", title: "Constellations through seasons", simple: "At different times of year, the night side of Earth faces different directions in space.", science: "As Earth orbits the Sun, the Sun's apparent position shifts eastward against the stars. Night-time observers therefore see different right ascensions in different seasons.", prompt: "Move the orbit slider to change Earth's position around the Sun.", visual: "Earth's orbit" },
        { id: "moon", title: "Why the Moon changes shape", simple: "The Moon is always half lit by the Sun; as it orbits Earth, we see different portions of its sunlit half.", science: "Lunar phase is the changing Sun-Earth-Moon viewing geometry during the Moon's roughly 29.53-day synodic cycle. Earth's shadow causes lunar eclipses, not the regular phases.", prompt: "Move the phase slider to reveal more of the sunlit hemisphere.", visual: "Lunar phases" },
        { id: "eclipses", title: "What causes eclipses", simple: "An eclipse happens when the Sun, Earth, and Moon line up closely enough for one body to cast a shadow on another.", science: "The Moon's orbit is tilted about 5° to Earth's orbital plane, so most new and full Moons do not create eclipses. Alignment near an orbital node is required.", prompt: "Move the alignment slider toward a near-line-up.", visual: "Orbital alignment" },
        { id: "meteors", title: "Recognising meteor showers", simple: "Meteors are brief streaks caused by small particles heating the air. During a shower, trails appear to radiate from one part of the sky.", science: "Earth crosses streams of cometary or asteroidal debris. Perspective makes the parallel meteoroid paths seem to converge at a radiant; meteors can appear anywhere, so look broadly rather than only at the radiant.", prompt: "Move the slider to reveal several radiant paths.", visual: "Meteor radiant" },
        { id: "pollution", title: "Light pollution", simple: "Unshielded and overly bright artificial light brightens the sky, hiding faint stars and the Milky Way.", science: "Scattered artificial light raises sky luminance and reduces contrast. Shielding fixtures, using only needed light, and choosing darker locations improve visibility.", prompt: "Adjust the sky-glow slider to see faint stars fade.", visual: "Sky brightness" },
        { id: "magnitude", title: "Astronomical magnitude", simple: "The magnitude scale describes apparent brightness. Smaller numbers mean brighter objects; negative values can be very bright.", science: "The scale is logarithmic: a difference of 5 magnitudes is a 100-fold flux ratio. Apparent magnitude is how bright an object looks from Earth, not its intrinsic luminosity.", prompt: "Change the example magnitude to compare apparent brightness.", visual: "Brightness scale" },
        { id: "lightyear", title: "What a light-year measures", simple: "A light-year is a distance, not a time: how far light travels in one year.", science: "In a vacuum, light travels about 299,792 km each second. One Julian year of travel is about 9.46 trillion kilometres; astronomy uses it to express stellar distances.", prompt: "Move the distance slider to compare nearby and distant stars.", visual: "Light travel" },
        { id: "milkyway", title: "Finding the Milky Way", simple: "The Milky Way is our home galaxy. From a dark place, we see its disk from the inside as a faint, milky band.", science: "The bright band traces the Galactic plane, where many stars, gas, and dust lie along our line of sight. Moonlight, clouds, and artificial sky glow can obscure it.", prompt: "Dim the dark sky to see how the Milky Way loses contrast.", visual: "Our galaxy" }
    ];

    const challenges = [
        { id: "polaris", title: "Find the North Star", task: "On the Ursa Major chart, identify the two bowl stars that point toward Polaris, then locate the star at the Little Dipper's handle end.", hint: "The pointer stars are Dubhe and Merak. Continue their line away from the bowl.", options: ["Dubhe and Merak", "Alioth and Mizar", "Phecda and Megrez"], answer: 0, explanation: "Dubhe and Merak point approximately to Polaris, about five pointer-star separations away. Polaris marks the north celestial pole closely, but not exactly." },
        { id: "orion", title: "Identify Orion", task: "Find Orion's short row of three Belt stars. Which group names those stars?", hint: "The Belt stars are Alnitak, Alnilam, and Mintaka.", options: ["Rigel, Saiph, Bellatrix", "Alnitak, Alnilam, Mintaka", "Betelgeuse, Rigel, Saiph"], answer: 1, explanation: "The three Belt stars anchor the pattern. Contrasting Betelgeuse and Rigel colours help orient Orion, though colour perception depends on darkness and eyesight." },
        { id: "venus", title: "Distinguish Venus from a bright star", task: "Choose the most useful combination of clues to tell Venus from a bright star.", hint: "Look for a steadier appearance and a changing position against background stars over several nights.", options: ["A current chart plus its changing position over nights", "Its colour alone", "It never changes position"], answer: 0, explanation: "Venus often appears steadier and changes position against the background stars over days. Neither clue alone is perfect; a current sky chart confirms identity. Venus is never far from the Sun." },
        { id: "dipper", title: "Find the Big Dipper", task: "Which description matches the Big Dipper pattern in Ursa Major?", hint: "The bowl has four stars and the handle has three.", options: ["A four-star bowl with a three-star handle", "A five-star zigzag W", "A compact four-star cross"], answer: 0, explanation: "The Big Dipper is a familiar asterism, not a separate constellation. It forms part of Ursa Major and is a useful way to locate Polaris." },
        { id: "moon", title: "Understand the Moon's phase", task: "Use the date/time control in Live Sky Observation Mode. What causes the Moon's changing shape?", hint: "The phase is controlled by how much of the Moon's sunlit half faces Earth.", options: ["The changing view of its sunlit half", "Earth's shadow every month", "The Moon creating different amounts of light"], answer: 0, explanation: "The Moon's phases come from changing viewing geometry as it orbits Earth. This page's phase estimate uses a mean synodic month and is approximate." },
        { id: "motion", title: "Identify celestial movement", task: "In the motion lesson, move the time slider. Which direction do stars appear to drift across the sky during a night?", hint: "Earth rotates eastward; apparent motion is the opposite direction.", options: ["Westward", "Eastward", "They do not move"], answer: 0, explanation: "Stars appear to move westward as Earth rotates eastward. The north celestial pole is a pivot point in the Northern Hemisphere sky." }
    ];

    const facts = [
        "A light-year is a distance: the path light travels in one year, about 9.46 trillion kilometres.",
        "The Sun is a star. It looks larger and brighter than other stars because it is much closer.",
        "Polaris lies close to the north celestial pole, but Earth's axis slowly changes direction over thousands of years.",
        "The Big Dipper is an asterism: a recognisable star pattern inside the larger constellation Ursa Major.",
        "A star's apparent magnitude describes how bright it looks from Earth; it does not directly tell how luminous it is.",
        "The Moon's regular phases are not caused by Earth's shadow. Earth's shadow produces lunar eclipses.",
        "The Milky Way's bright band is our view through the disk of our own galaxy.",
        "Venus is the brightest planet in Earth's sky, but it stays close to the Sun and is seen in twilight."
    ];

    const questions = {
        beginner: [
            { q: "Which two Big Dipper stars point roughly toward Polaris?", options: ["Dubhe and Merak", "Alioth and Mizar", "Betelgeuse and Rigel", "Castor and Pollux"], answer: 0, why: "Dubhe and Merak form the outer edge of the bowl. Extending their line away from the bowl leads near Polaris.", visual: "✦ Polaris  ·  ↑  ·  Dubhe — Merak" },
            { q: "What causes the Moon's familiar phases?", options: ["Earth's shadow every month", "Changing views of the Moon's sunlit half", "Clouds over the Moon", "The Moon switching its own light on and off"], answer: 1, why: "The Sun always illuminates half the Moon. Our changing view of that lit half during the lunar orbit creates the phases." },
            { q: "Which constellation is shown by this belt-and-corner star pattern?", options: ["Orion", "Crux", "Leo", "Cassiopeia"], answer: 0, why: "Orion's Belt is the short, straight row of Alnitak, Alnilam, and Mintaka, between the constellation's bright corner stars.", visual: "orion" }
        ],
        intermediate: [
            { q: "Why can planets often appear steadier than stars?", options: ["Planets make their own light", "Their apparent disks average atmospheric shimmer", "They are outside Earth's atmosphere", "They do not move"], answer: 1, why: "Planets are tiny disks rather than unresolved points. Different parts of the disk are distorted differently, averaging some scintillation.", visual: "disk" },
            { q: "What does a five-magnitude difference correspond to in brightness?", options: ["About 5 times", "About 10 times", "About 100 times", "About 1,000 times"], answer: 2, why: "The astronomical magnitude scale is logarithmic: five magnitudes represent a factor of 100 in flux." },
            { q: "Why do different constellations dominate at different seasons?", options: ["Stars move around Earth each season", "Earth orbits the Sun and the night side faces different directions", "The stars switch on seasonally", "The Moon blocks constellations"], answer: 1, why: "As Earth moves around the Sun, the night side points toward different parts of the distant star background." }
        ],
        advanced: [
            { q: "Why don't we get a solar or lunar eclipse every new or full Moon?", options: ["The Moon's orbit is tilted to Earth's orbital plane", "The Sun changes size", "Earth's rotation stops alignment", "The Moon is too far away at every phase"], answer: 0, why: "The Moon's orbital plane is inclined by about 5 degrees. Eclipses require the new/full Moon to pass close to a node where the planes intersect.", visual: "eclipse" },
            { q: "Which statement about apparent magnitude is correct?", options: ["It measures intrinsic power only", "Larger numbers mean brighter objects", "It describes observed brightness from Earth", "It is a distance unit"], answer: 2, why: "Apparent magnitude describes received brightness. Intrinsic luminosity is different; distance and extinction affect how bright an object appears." },
            { q: "What does a star's right ascension measure?", options: ["Angular position east-west on the celestial sphere", "Distance from Earth", "Surface temperature", "Height above a local horizon"], answer: 0, why: "Right ascension is an equatorial coordinate analogous to longitude on the celestial sphere, usually expressed in hours. It is not local altitude or distance." }
        ]
    };

    const storageKey = "tsukuyomi_astral_academy_v1";
    const safeRead = () => {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
            return value && typeof value === "object" && !Array.isArray(value) ? value : {};
        } catch (error) {
            console.warn("Astral Academy progress could not be read.", error);
            return {};
        }
    };
    const saved = safeRead();
    const validProgressKeys = new Set([
        ...lessons.map(item => `lesson:${item.id}`),
        ...challenges.map(item => `challenge:${item.id}`),
        ...constellations.map(item => `constellation:${item.id}`)
    ]);
    const completed = new Set(Array.isArray(saved.completed)
        ? saved.completed.filter(item => validProgressKeys.has(item))
        : []);
    let activeConstellation = constellations[0];
    let activeStar = null;
    let activeLesson = lessons[0];
    let activeChallenge = challenges[0];
    let zoom = 1;
    let showLines = true;
    let showLabels = true;
    let showEquator = false;
    let showPlanetLabels = false;
    let quizIndex = 0;
    let quizCorrect = Number.isSafeInteger(saved.quizCorrect) && saved.quizCorrect >= 0 ? saved.quizCorrect : 0;
    let quizAnswered = Number.isSafeInteger(saved.quizAnswered) && saved.quizAnswered >= quizCorrect ? saved.quizAnswered : quizCorrect;
    let quizSelection = null;
    let lastFact = -1;
    let canvasContext;

    const byId = id => document.getElementById(id);
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    function persist() {
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                completed: [...completed],
                quizCorrect,
                quizAnswered,
                level: byId("academy-level").value
            }));
        } catch (error) {
            console.warn("Astral Academy progress could not be saved.", error);
        }
    }

    function award(key) {
        completed.add(key);
        persist();
        renderProgress();
        if (key.startsWith("lesson:")) {
            renderLessonList();
            renderLesson();
        } else if (key.startsWith("constellation:")) {
            renderConstellationDetail();
        }
    }

    function renderProgress() {
        const total = lessons.length + challenges.length + constellations.length;
        const count = Math.min(total, completed.size);
        const percent = Math.round(count / total * 100);
        byId("academy-progress-value").textContent = `${percent}%`;
        byId("academy-progress-fill").style.width = `${percent}%`;
        byId("academy-progress-bar").setAttribute("aria-valuenow", String(percent));
        byId("academy-progress-copy").textContent = `${count} of ${total} learning milestones complete · ${quizCorrect} quiz answers correct`;
        const badgeNames = [
            { at: 1, name: "Sky Beginner" },
            { at: 3, name: "Star Explorer" },
            { at: 6, name: "Constellation Hunter" },
            { at: 10, name: "Celestial Navigator" },
            { at: 16, name: "Cosmic Observer" },
            { at: 25, name: "Astronomy Master" }
        ];
        const badges = byId("academy-badges");
        badges.replaceChildren();
        const earned = badgeNames.filter(badge => count >= badge.at);
        if (!earned.length) {
            badges.append(el("span", "academy-badge locked", "First badge · complete one milestone"));
        } else {
            earned.forEach(badge => badges.append(el("span", "academy-badge", `✦ ${badge.name}`)));
        }
        const nextLesson = lessons.find(item => !completed.has(`lesson:${item.id}`));
        const nextChallenge = challenges.find(item => !completed.has(`challenge:${item.id}`));
        const nextConstellation = constellations.find(item => !completed.has(`constellation:${item.id}`));
        const next = nextLesson
            ? { type: "lesson", item: nextLesson, target: "academy-lessons" }
            : nextChallenge
                ? { type: "challenge", item: nextChallenge, target: "academy-challenges" }
                : nextConstellation
                    ? { type: "constellation", item: nextConstellation, target: "academy-constellations" }
                    : { type: "map", item: null, target: "academy-map" };
        const continueButton = byId("academy-continue-learning");
        continueButton.href = `#${next.target}`;
        continueButton.dataset.kind = next.type;
        continueButton.dataset.item = next.item ? next.item.id : "";
    }

    function renderDiscovery() {
        const day = Math.floor(Date.now() / 86400000);
        const discovery = lessons[day % lessons.length];
        byId("academy-discovery-title").textContent = discovery.title;
        byId("academy-discovery-copy").textContent = discovery.simple;
    }

    function renderFacts() {
        const dailySeed = Math.floor(Date.now() / 86400000);
        lastFact = (dailySeed + Math.floor(Math.random() * facts.length)) % facts.length;
        byId("academy-fact-copy").textContent = facts[lastFact];
    }

    function selectedStars() {
        return stars.filter(star => star.constellation === activeConstellation.id);
    }

    function chartCoordinates(list) {
        const anchor = list[0].ra;
        const points = list.map(star => {
            let ra = star.ra;
            while (ra - anchor > 12) ra -= 24;
            while (ra - anchor < -12) ra += 24;
            return { star, ra, dec: star.dec };
        });
        const centerDec = points.reduce((sum, point) => sum + point.dec, 0) / points.length;
        const raScale = Math.cos(centerDec * Math.PI / 180) * 15;
        points.forEach(point => { point.xValue = point.ra * raScale; });
        return {
            points,
            minX: Math.min(...points.map(point => point.xValue)),
            maxX: Math.max(...points.map(point => point.xValue)),
            minDec: Math.min(...points.map(point => point.dec)),
            maxDec: Math.max(...points.map(point => point.dec))
        };
    }

    function chartLayout(list, width, height) {
        const margin = { left: 44, right: 24, top: 28, bottom: 36 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        const chart = chartCoordinates(list);
        const minX = chart.minX - 2;
        const maxX = chart.maxX + 2;
        const minDec = chart.minDec - 4;
        const maxDec = chart.maxDec + 4;
        const scale = Math.min(
            chartWidth / (maxX - minX),
            chartHeight / (maxDec - minDec)
        );
        const centerX = (minX + maxX) / 2;
        const centerDec = (minDec + maxDec) / 2;
        const centerPixelX = margin.left + chartWidth / 2;
        const centerPixelY = margin.top + chartHeight / 2;
        const project = point => ({
            x: centerPixelX - (point.xValue - centerX) * scale,
            y: centerPixelY - (point.dec - centerDec) * scale
        });
        return {
            ...chart,
            minDec,
            maxDec,
            left: margin.left,
            top: margin.top,
            width: chartWidth,
            height: chartHeight,
            project,
            projectDec: dec => centerPixelY - (dec - centerDec) * scale
        };
    }

    function renderConstellationSelect() {
        const select = byId("academy-constellation-select");
        const planet = byId("academy-planet-select");
        const level = byId("academy-level");
        const savedLevel = ["beginner", "intermediate", "advanced"].includes(saved.level) ? saved.level : "beginner";
        level.value = savedLevel;
        const options = constellations.map(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.id;
            return option;
        });
        select.replaceChildren(...options);
        planet.replaceChildren(...planets.map(item => {
            const option = document.createElement("option");
            option.value = item.name;
            option.textContent = item.name;
            return option;
        }));
    }

    function selectConstellation(id) {
        const found = constellations.find(item => item.id === id);
        if (!found) return;
        activeConstellation = found;
        byId("academy-constellation-select").value = id;
        renderConstellationDetail();
        renderStarPicks();
        renderStarChart();
        const firstStar = selectedStars()[0];
        if (firstStar) showStar(firstStar);
    }

    function renderConstellationDetail() {
        const root = byId("academy-constellation-detail");
        root.replaceChildren();
        root.append(el("span", "panel-kicker", `FIELD GUIDE · ${activeConstellation.id.toUpperCase()}`));
        root.append(el("h3", "", activeConstellation.id));
        const description = el("p", "", activeConstellation.shape);
        root.append(description);
        const factsGrid = el("div", "academy-guide-meta");
        [["Best viewing season", activeConstellation.season], ["Approximate visibility", activeConstellation.visibility], ["Nearby deep-sky objects", activeConstellation.deepSky]].forEach(([label, value]) => {
            const item = el("div", "");
            item.append(el("strong", "", label), el("span", "", value));
            factsGrid.append(item);
        });
        root.append(factsGrid, el("h4", "", "A simple way to find it"));
        const list = el("ol", "academy-step-list");
        activeConstellation.steps.forEach(step => list.append(el("li", "", step)));
        root.append(list, el("p", "academy-data-note", activeConstellation.fact));
        const done = el("button", "text-button", completed.has(`constellation:${activeConstellation.id}`) ? "CONSTELLATION EXPLORED ✓" : "MARK CONSTELLATION EXPLORED ✓");
        done.type = "button";
        done.addEventListener("click", () => award(`constellation:${activeConstellation.id}`));
        root.append(done);
    }

    function drawEquator(ctx, bounds) {
        if (!showEquator || bounds.minDec > 0 || bounds.maxDec < 0) return;
        const y = bounds.projectDec(0);
        ctx.save();
        ctx.strokeStyle = "rgba(113, 204, 230, .7)";
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bounds.left, y);
        ctx.lineTo(bounds.left + bounds.width, y);
        ctx.stroke();
        ctx.fillStyle = "#a9e5f2";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText("CELESTIAL EQUATOR · DEC 0°", bounds.left + 10, y - 7);
        ctx.restore();
    }

    function renderStarChart() {
        const canvas = byId("academy-star-canvas");
        if (!canvas || !canvasContext) return;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(300, rect.width);
        const height = Math.max(270, rect.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        const ctx = canvasContext;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0b1725");
        gradient.addColorStop(1, "#07101b");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        const list = selectedStars();
        const bounds = chartLayout(list, width, height);
        const pointByName = new Map(bounds.points.map(point => [point.star.name, point]));
        const project = star => bounds.project(pointByName.get(star.name));
        const margin = { left: bounds.left, right: 24, top: bounds.top, bottom: 36 };
        const chartWidth = bounds.width;
        const chartHeight = bounds.height;
        ctx.strokeStyle = "rgba(157, 184, 203, .12)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const x = margin.left + chartWidth * i / 5;
            const y = margin.top + chartHeight * i / 5;
            ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + chartHeight); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + chartWidth, y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(218, 234, 245, .5)";
        ctx.font = "10px Inter, sans-serif";
        ctx.fillText("N ↑", 12, 21);
        ctx.fillText("E ←", width - 43, height - 8);
        ctx.fillText("RIGHT ASCENSION · EAST ←", width / 2 - 72, height - 8);
        ctx.save();
        ctx.translate(margin.left + chartWidth / 2, margin.top + chartHeight / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-(margin.left + chartWidth / 2), -(margin.top + chartHeight / 2));
        drawEquator(ctx, bounds);
        const byName = new Map(list.map(star => [star.name, star]));
        if (showLines) {
            ctx.strokeStyle = "rgba(126, 198, 219, .62)";
            ctx.lineWidth = 1.3;
            activeConstellation.lines.forEach(([from, to]) => {
                const first = byName.get(from);
                const second = byName.get(to);
                if (!first || !second) return;
                const a = project(first);
                const b = project(second);
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            });
        }
        ctx.font = "11px Inter, sans-serif";
        const labelBoxes = [];
        list.forEach(star => {
            const point = project(star);
            const radius = Math.max(2.4, Math.min(7, 5.2 - star.magnitude * 0.7));
            const selected = activeStar && activeStar.name === star.name;
            ctx.beginPath();
            ctx.fillStyle = selected ? "#f8d9ad" : "#f0f5ff";
            ctx.shadowColor = selected ? "rgba(248,217,173,.85)" : "rgba(177,218,255,.55)";
            ctx.shadowBlur = selected ? 13 : 7;
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            if (showLabels) {
                ctx.fillStyle = selected ? "#ffe9ca" : "rgba(232,241,248,.82)";
                const labelWidth = ctx.measureText(star.name).width;
                const candidates = [
                    [point.x + 8, point.y - 7],
                    [point.x + 8, point.y + 15],
                    [point.x - labelWidth - 8, point.y - 7],
                    [point.x - labelWidth / 2, point.y - 14],
                    [point.x - labelWidth / 2, point.y + 20]
                ];
                const label = candidates.map(([x, baseline]) => ({
                    x: Math.max(4, Math.min(width - labelWidth - 4, x)),
                    y: Math.max(13, Math.min(height - 8, baseline)),
                    width: labelWidth
                })).find(candidate => labelBoxes.every(other =>
                    candidate.x + candidate.width + 3 < other.x ||
                    other.x + other.width + 3 < candidate.x ||
                    candidate.y + 4 < other.y - 11 ||
                    other.y + 4 < candidate.y - 11
                )) || { x: Math.max(4, Math.min(width - labelWidth - 4, point.x + 8)), y: Math.max(13, Math.min(height - 8, point.y - 7)), width: labelWidth };
                labelBoxes.push(label);
                ctx.fillText(star.name, label.x, label.y);
            }
        });
        ctx.restore();
        byId("academy-chart-caption").textContent = showPlanetLabels
            ? "Catalog star coordinates · equatorial view · planet positions not plotted (no ephemeris) · local horizon not shown"
            : "Approximate J2000 catalog coordinates · north is up · east is left · local horizon is not shown";
    }

    function showStar(star) {
        if (!star) return;
        activeStar = star;
        byId("academy-star-name").textContent = star.name;
        byId("academy-star-constellation").textContent = star.constellation;
        byId("academy-star-distance").textContent = `~${star.distance.toLocaleString()} light-years`;
        byId("academy-star-magnitude").textContent = star.magnitude.toFixed(2);
        byId("academy-star-spectral").textContent = star.spectral;
        byId("academy-star-ra").textContent = `${star.ra.toFixed(3)} h`;
        byId("academy-star-dec").textContent = `${star.dec >= 0 ? "+" : "−"}${Math.abs(star.dec).toFixed(3)}°`;
        byId("academy-star-fact").textContent = star.fact;
        renderStarPicks();
        renderStarChart();
    }

    function renderStarPicks() {
        const list = byId("academy-star-picks");
        list.replaceChildren();
        selectedStars().forEach(star => {
            const button = el("button", `academy-star-pick${activeStar && activeStar.name === star.name ? " selected" : ""}`, star.name);
            button.type = "button";
            button.setAttribute("aria-pressed", String(Boolean(activeStar && activeStar.name === star.name)));
            button.addEventListener("click", () => showStar(star));
            list.append(button);
        });
    }

    function renderConstellationList() {
        const root = byId("academy-constellation-list");
        root.replaceChildren();
        const filter = byId("academy-star-search").value.trim().toLowerCase();
        const visible = filter
            ? constellations.filter(item => item.id.toLowerCase().includes(filter) || stars.some(star => star.constellation === item.id && star.name.toLowerCase().includes(filter)))
            : constellations;
        visible.forEach(item => {
            const label = `${completed.has(`constellation:${item.id}`) ? "✓ " : ""}${item.id}`;
            const button = el("button", `academy-constellation-button${activeConstellation.id === item.id ? " active" : ""}`, label);
            button.type = "button";
            button.addEventListener("click", () => selectConstellation(item.id));
            root.append(button);
        });
    }

    function renderPlanet() {
        const planet = planets.find(item => item.name === byId("academy-planet-select").value) || planets[0];
        const root = byId("academy-planet-profile");
        root.replaceChildren();
        root.append(el("h4", "", planet.name), el("p", "", planet.fact), el("p", "", `Approximate orbital period: ${planet.period}.`), el("p", "", planet.tip));
    }

    function renderLesson() {
        const root = byId("academy-lesson-detail");
        root.replaceChildren();
        root.append(el("span", "panel-kicker", "VISUAL EXPLAINER"), el("h3", "", activeLesson.title), el("p", "", activeLesson.simple));
        const scene = el("div", `academy-demo-scene demo-${activeLesson.id}`);
        scene.setAttribute("aria-label", activeLesson.visual);
        scene.append(el("span", "academy-demo-object", "✦"), el("span", "academy-demo-label", activeLesson.visual));
        root.append(scene, el("h4", "", "The science"), el("p", "", activeLesson.science), el("label", "", activeLesson.prompt));
        const range = document.createElement("input");
        range.type = "range"; range.min = "0"; range.max = "100"; range.value = "50";
        range.id = "academy-demo-range"; range.setAttribute("aria-label", activeLesson.prompt);
        const output = el("output", "academy-demo-output", "50%");
        range.addEventListener("input", () => {
            scene.style.setProperty("--demo-value", `${range.value}%`);
            scene.style.setProperty("--demo-angle", `${Number(range.value) * 3.6}deg`);
            scene.style.setProperty("--demo-opacity", String(1 - Number(range.value) / 130));
            scene.style.setProperty("--demo-blur", `${Number(range.value) / 40}px`);
            scene.style.setProperty("--demo-brightness", String(.55 + Number(range.value) / 100));
            output.textContent = `${range.value}%`;
        });
        root.append(range, output);
        const button = el("button", "text-button", completed.has(`lesson:${activeLesson.id}`) ? "LESSON COMPLETE ✓" : "MARK LESSON COMPLETE ✓");
        button.type = "button";
        button.addEventListener("click", () => award(`lesson:${activeLesson.id}`));
        root.append(button);
    }

    function renderLessonList() {
        const root = byId("academy-lesson-list");
        root.replaceChildren();
        lessons.forEach(lesson => {
            const button = el("button", `academy-lesson-button${activeLesson.id === lesson.id ? " active" : ""}`, `${completed.has(`lesson:${lesson.id}`) ? "✓ " : ""}${lesson.title}`);
            button.type = "button";
            button.addEventListener("click", () => {
                activeLesson = lesson;
                renderLessonList();
                renderLesson();
            });
            root.append(button);
        });
    }

    function renderChallenge() {
        const root = byId("academy-challenge-detail");
        root.replaceChildren();
        const done = completed.has(`challenge:${activeChallenge.id}`);
        root.append(el("span", "panel-kicker", `FIELD CHALLENGE · ${done ? "COMPLETE" : "IN PROGRESS"}`), el("h3", "", activeChallenge.title), el("p", "", activeChallenge.task));
        const demonstration = el("div", "academy-challenge-visual");
        demonstration.setAttribute("aria-label", "Simplified star pattern demonstration");
        demonstration.textContent = ({
            polaris: "Dubhe ✦ — ✦ Merak  · · · · ·  ✧ Polaris",
            orion: "Betelgeuse ✦   ✦ Bellatrix  /  ✦ — ✦ — ✦  /  Rigel ✦",
            venus: "★ Background star  ·  ● Planet shifts against the stars",
            dipper: "✦ Dubhe  ✦ Merak  /  ✦ Phecda  ✦ Megrez  — ✦ Alioth — ✦ Mizar — ✦ Alkaid",
            moon: "☀  →  🌒  →  🌓  →  🌔  →  🌕",
            motion: "Eastward Earth rotation  ↻  ·  apparent star drift  ← west"
        })[activeChallenge.id];
        root.append(demonstration);
        const answerFeedback = el("p", "academy-challenge-feedback", done ? activeChallenge.explanation : "Choose the best answer to complete the activity.");
        const options = el("div", "academy-challenge-options");
        if (!done) {
            activeChallenge.options.forEach((text, index) => {
                const option = el("button", "academy-challenge-option", text);
                option.type = "button";
                option.addEventListener("click", () => {
                    if (index !== activeChallenge.answer) {
                        answerFeedback.textContent = "Not quite. Review the chart or open a hint, then try again.";
                        answerFeedback.classList.add("incorrect");
                        return;
                    }
                    award(`challenge:${activeChallenge.id}`);
                    renderChallengeList();
                    renderChallenge();
                });
                options.append(option);
            });
        }
        const actions = el("div", "academy-challenge-actions");
        const hint = el("button", "secondary-button", "SHOW A HINT");
        hint.type = "button";
        const hintText = el("p", "academy-hint", "");
        hint.addEventListener("click", () => {
            hintText.textContent = activeChallenge.hint;
            hint.setAttribute("aria-expanded", "true");
        });
        actions.append(hint);
        root.append(options, answerFeedback, actions, hintText);
    }

    function renderChallengeList() {
        const root = byId("academy-challenge-list");
        root.replaceChildren();
        challenges.forEach(challenge => {
            const button = el("button", `academy-challenge-button${activeChallenge.id === challenge.id ? " active" : ""}`, `${completed.has(`challenge:${challenge.id}`) ? "✓ " : ""}${challenge.title}`);
            button.type = "button";
            button.addEventListener("click", () => {
                activeChallenge = challenge;
                renderChallengeList();
                renderChallenge();
            });
            root.append(button);
        });
    }

    function quizIllustration(kind) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 360 112");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", kind === "orion"
            ? "Simplified Orion star pattern with a three-star belt"
            : kind === "disk"
                ? "Comparison of unresolved star point and small planet disk"
                : "Diagram of the Sun, Earth, and Moon orbital planes");
        const add = (name, attributes) => {
            const node = document.createElementNS("http://www.w3.org/2000/svg", name);
            Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
            svg.append(node);
            return node;
        };
        const text = (x, y, label) => {
            const node = add("text", { x, y, fill: "#c5d8e2", "font-size": "10", "text-anchor": "middle" });
            node.textContent = label;
        };
        const line = (x1, y1, x2, y2, dash = false) => add("line", {
            x1, y1, x2, y2,
            stroke: "#78b8cf",
            "stroke-width": "1.5",
            ...(dash ? { "stroke-dasharray": "4 4" } : {})
        });
        if (kind === "orion") {
            const points = [[57,20],[105,28],[142,48],[164,48],[187,48],[220,77],[124,78]];
            [[0,1],[1,2],[2,3],[3,4],[4,5],[5,3],[0,6],[1,4]].forEach(([a,b]) => line(points[a][0], points[a][1], points[b][0], points[b][1]));
            points.forEach(([cx,cy], index) => add("circle", { cx, cy, r: index >= 2 && index <= 4 ? 4 : 5, fill: index === 0 ? "#e4aa80" : "#e6f4ff" }));
            text(163, 72, "ORION'S BELT");
        } else if (kind === "disk") {
            add("circle", { cx: 105, cy: 47, r: 3, fill: "#f4d8a8" });
            add("circle", { cx: 246, cy: 47, r: 16, fill: "rgba(120,184,207,.2)", stroke: "#9bd5e7", "stroke-width": "2" });
            text(105, 86, "STAR · POINT SOURCE");
            text(246, 86, "PLANET · SMALL DISK");
        } else {
            add("circle", { cx: 67, cy: 52, r: 22, fill: "#e7bb72" });
            add("circle", { cx: 184, cy: 52, r: 13, fill: "#91b5c5" });
            add("circle", { cx: 302, cy: 52, r: 7, fill: "#ddd4c4" });
            line(91, 52, 289, 52, true);
            line(170, 15, 198, 89);
            line(170, 89, 198, 15);
            text(67, 94, "SUN");
            text(184, 94, "EARTH");
            text(302, 94, "MOON");
        }
        return svg;
    }

    function renderQuiz() {
        const level = byId("academy-level").value;
        const bank = questions[level];
        const question = bank[quizIndex % bank.length];
        quizSelection = null;
        byId("academy-quiz-level").textContent = level.toUpperCase();
        byId("academy-quiz-score").textContent = `${quizCorrect} correct · ${quizAnswered} answered`;
        const root = byId("academy-quiz-question");
        root.replaceChildren(el("h4", "", question.q));
        if (question.visual) {
            const visual = el("div", "academy-quiz-visual");
            visual.append(quizIllustration(question.visual));
            root.append(visual);
        }
        const options = byId("academy-quiz-options");
        options.replaceChildren();
        question.options.forEach((text, index) => {
            const button = el("button", "academy-quiz-option", text);
            button.type = "button";
            button.addEventListener("click", () => {
                if (quizSelection !== null) return;
                quizSelection = index;
                quizAnswered++;
                if (index === question.answer) quizCorrect++;
                [...options.children].forEach((option, optionIndex) => {
                    option.disabled = true;
                    if (optionIndex === question.answer) option.classList.add("correct");
                    else if (optionIndex === index) option.classList.add("incorrect");
                });
                byId("academy-quiz-feedback").textContent = `${index === question.answer ? "Correct. " : "Not quite. "}${question.why}`;
                byId("academy-quiz-next").hidden = false;
                byId("academy-quiz-score").textContent = `${quizCorrect} correct · ${quizAnswered} answered`;
                persist();
                renderProgress();
            });
            options.append(button);
        });
        byId("academy-quiz-feedback").textContent = "";
        byId("academy-quiz-next").hidden = true;
    }

    function localDateTimeValue(date) {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }

    function solarEvent(date, latitude, longitude, zenith, sunrise) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const dayOfYear = Math.floor(
            (Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86400000
        ) + 1;
        const longitudeHour = longitude / 15;
        const approximateTime = dayOfYear + ((sunrise ? 6 : 18) - longitudeHour) / 24;
        const meanAnomaly = .9856 * approximateTime - 3.289;
        const trueLongitude = ((meanAnomaly +
            1.916 * Math.sin(meanAnomaly * Math.PI / 180) +
            .020 * Math.sin(2 * meanAnomaly * Math.PI / 180) +
            282.634) % 360 + 360) % 360;
        let rightAscension = Math.atan(.91764 * Math.tan(trueLongitude * Math.PI / 180)) * 180 / Math.PI;
        rightAscension = ((rightAscension % 360) + 360) % 360;
        rightAscension += Math.floor(trueLongitude / 90) * 90 -
            Math.floor(rightAscension / 90) * 90;
        rightAscension /= 15;
        const sinDeclination = .39782 * Math.sin(trueLongitude * Math.PI / 180);
        const cosDeclination = Math.cos(Math.asin(sinDeclination));
        const latitudeRadians = latitude * Math.PI / 180;
        const cosHourAngle = (
            Math.cos(zenith * Math.PI / 180) -
            sinDeclination * Math.sin(latitudeRadians)
        ) / (cosDeclination * Math.cos(latitudeRadians));
        if (!Number.isFinite(cosHourAngle) || cosHourAngle < -1 || cosHourAngle > 1) return null;
        const hourAngleDegrees = Math.acos(cosHourAngle) * 180 / Math.PI;
        const hourAngle = (sunrise ? 360 - hourAngleDegrees : hourAngleDegrees) / 15;
        const localMeanTime = hourAngle + rightAscension - .06571 * approximateTime - 6.622;
        const utcHours = localMeanTime - longitudeHour;
        return new Date(Date.UTC(year, month, day) + utcHours * 3600000);
    }

    function formatUtcTime(date) {
        if (!date) return "Sun does not reach this altitude";
        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
            timeZoneName: "short"
        }).format(date);
    }

    function renderLiveReadout() {
        const lat = Number(byId("academy-latitude").value);
        const lon = Number(byId("academy-longitude").value);
        const dateValue = byId("academy-observe-time").value;
        const root = byId("academy-live-readout");
        root.replaceChildren();
        if (!dateValue) {
            root.append(el("p", "", "Choose a date and time to calculate an approximate Moon phase."));
            return;
        }
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            root.append(el("p", "academy-error", "Enter a valid local date and time."));
            return;
        }
        if ((byId("academy-latitude").value && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
            (byId("academy-longitude").value && (!Number.isFinite(lon) || lon < -180 || lon > 180))) {
            root.append(el("p", "academy-error", "Latitude must be between −90 and 90; longitude must be between −180 and 180."));
            return;
        }
        const hasLatitude = byId("academy-latitude").value.trim() !== "";
        const hasLongitude = byId("academy-longitude").value.trim() !== "";
        if (hasLatitude !== hasLongitude) {
            root.append(el("p", "", "Enter both latitude and longitude, or leave both blank."));
            return;
        }
        const phase = window.TsukuyomiMath && window.TsukuyomiMath.getMoonPhase(date);
        const details = el("div", "academy-live-facts");
        details.append(el("div", "", `BROWSER LOCAL DATE & TIME · ${date.toLocaleString()}`));
        if (hasLatitude && hasLongitude) details.append(el("div", "", `LOCATION · ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`));
        if (phase) details.append(el("div", "", `APPROXIMATE MOON · ${phase.emoji} ${phase.name} · ${phase.illumination}% illuminated`));
        if (hasLatitude && hasLongitude) {
            const solarEvents = [
                ["Sunrise · approx.", solarEvent(date, lat, lon, 90.833, true)],
                ["Sunset · approx.", solarEvent(date, lat, lon, 90.833, false)],
                ["Astronomical dawn · approx.", solarEvent(date, lat, lon, 108, true)],
                ["Astronomical dusk · approx.", solarEvent(date, lat, lon, 108, false)]
            ];
            solarEvents.forEach(([label, eventDate]) => {
                details.append(el("div", "", `${label} · ${formatUtcTime(eventDate)}`));
            });
        }
        root.append(details);
        if (!hasLatitude || !hasLongitude) {
            root.append(el("p", "", "Enter coordinates to estimate sunrise, sunset, and astronomical twilight."));
        }
        if (window.TsukuyomiMath) {
            const meteorEvents = window.TsukuyomiMath.generateMeteorShowerEvents(date, 370).slice(0, 3);
            if (meteorEvents.length) {
                const meteorList = el("div", "academy-live-facts");
                meteorList.append(el("div", "", "UPCOMING METEOR SHOWER PEAK-DATE ESTIMATES"));
                meteorEvents.forEach(event => {
                    meteorList.append(el("div", "", `${event.title} · ${new Date(event.date).toLocaleDateString()}`));
                });
                root.append(meteorList);
            }
        }
        root.append(el("p", "", "Solar times are approximate and shown in UTC. Moonrise/moonset, live planet positions, location-specific constellation visibility, and weather are unavailable—not guessed."));
    }

    function bindEvents() {
        byId("academy-constellation-select").addEventListener("change", event => selectConstellation(event.target.value));
        byId("academy-toggle-lines").addEventListener("click", event => {
            showLines = !showLines; event.currentTarget.setAttribute("aria-pressed", String(showLines));
            event.currentTarget.textContent = `LINES ${showLines ? "ON" : "OFF"}`; renderStarChart();
        });
        byId("academy-toggle-labels").addEventListener("click", event => {
            showLabels = !showLabels; event.currentTarget.setAttribute("aria-pressed", String(showLabels));
            event.currentTarget.textContent = `LABELS ${showLabels ? "ON" : "OFF"}`; renderStarChart();
        });
        byId("academy-toggle-equator").addEventListener("click", event => {
            showEquator = !showEquator; event.currentTarget.setAttribute("aria-pressed", String(showEquator));
            event.currentTarget.textContent = `EQUATOR ${showEquator ? "ON" : "OFF"}`; renderStarChart();
        });
        byId("academy-toggle-planets").addEventListener("click", event => {
            showPlanetLabels = !showPlanetLabels; event.currentTarget.setAttribute("aria-pressed", String(showPlanetLabels));
            event.currentTarget.textContent = `PLANET LABELS ${showPlanetLabels ? "ON" : "OFF"}`; renderStarChart();
        });
        byId("academy-zoom-in").addEventListener("click", () => { zoom = Math.min(2.5, Math.round((zoom + 0.25) * 100) / 100); byId("academy-zoom-value").textContent = `${zoom.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`; renderStarChart(); });
        byId("academy-zoom-out").addEventListener("click", () => { zoom = Math.max(0.75, Math.round((zoom - 0.25) * 100) / 100); byId("academy-zoom-value").textContent = `${zoom.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×`; renderStarChart(); });
        byId("academy-star-search").addEventListener("input", event => {
            const query = event.target.value.trim().toLowerCase();
            renderConstellationList();
            const match = stars.find(star => star.name.toLowerCase().includes(query) && query);
            if (query && match) {
                selectConstellation(match.constellation);
                showStar(match);
                byId("academy-map-error").hidden = true;
            } else if (query) {
                const constellationMatch = constellations.find(item => item.id.toLowerCase().includes(query));
                if (constellationMatch) {
                    selectConstellation(constellationMatch.id);
                    byId("academy-map-error").hidden = true;
                } else {
                    byId("academy-map-error").hidden = false;
                    byId("academy-map-error").textContent = "No matching catalog star or constellation found.";
                }
            } else {
                byId("academy-map-error").hidden = true;
            }
        });
        byId("academy-star-canvas").addEventListener("click", event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const width = Math.max(300, rect.width);
            const height = Math.max(270, rect.height);
            const list = selectedStars();
            const layout = chartLayout(list, width, height);
            const canvasX = (event.clientX - rect.left) * width / rect.width;
            const canvasY = (event.clientY - rect.top) * height / rect.height;
            const x = (canvasX - width / 2) / zoom + width / 2;
            const y = (canvasY - height / 2) / zoom + height / 2;
            let closest = null, closestDistance = 22;
            layout.points.forEach(point => {
                const star = point.star;
                const projected = layout.project(point);
                const sx = projected.x;
                const sy = projected.y;
                const distance = Math.hypot(sx - x, sy - y);
                if (distance < closestDistance) { closest = star; closestDistance = distance; }
            });
            if (closest) showStar(closest);
        });
        byId("academy-planet-select").addEventListener("change", renderPlanet);
        byId("academy-level").addEventListener("change", () => { persist(); quizIndex = 0; renderQuiz(); });
        byId("academy-quiz-next").addEventListener("click", () => { quizIndex++; renderQuiz(); });
        byId("academy-continue-learning").addEventListener("click", event => {
            event.preventDefault();
            const button = event.currentTarget;
            if (button.dataset.kind === "lesson") {
                activeLesson = lessons.find(item => item.id === button.dataset.item) || lessons[0];
                renderLessonList();
                renderLesson();
            } else if (button.dataset.kind === "challenge") {
                activeChallenge = challenges.find(item => item.id === button.dataset.item) || challenges[0];
                renderChallengeList();
                renderChallenge();
            } else if (button.dataset.kind === "constellation") {
                selectConstellation(button.dataset.item);
            }
            byId(button.getAttribute("href").slice(1)).scrollIntoView({ behavior: "smooth", block: "start" });
        });
        document.querySelectorAll("[data-academy-lesson]").forEach(button => {
            button.addEventListener("click", () => {
                const lesson = lessons.find(item => item.id === button.dataset.academyLesson);
                if (!lesson) return;
                activeLesson = lesson;
                renderLessonList();
                renderLesson();
                byId("academy-lessons").scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
        document.querySelectorAll("[data-academy-complete]").forEach(button => {
            button.addEventListener("click", () => {
                award(`lesson:${button.dataset.academyComplete}`);
                button.textContent = "NAVIGATION LESSON COMPLETE ✓";
            });
        });
        byId("academy-new-fact").addEventListener("click", () => {
            let next = Math.floor(Math.random() * facts.length);
            if (facts.length > 1 && next === lastFact) next = (next + 1) % facts.length;
            lastFact = next; byId("academy-fact-copy").textContent = facts[lastFact];
        });
        byId("academy-find-constellation").addEventListener("click", () => {
            byId("academy-constellation-select").value = activeConstellation.id;
            byId("academy-map").scrollIntoView({ behavior: "smooth", block: "start" });
            byId("academy-star-canvas").focus({ preventScroll: true });
        });
        byId("academy-use-location").addEventListener("click", () => {
            if (!navigator.geolocation) {
                byId("academy-live-readout").textContent = "Location permission is not available in this browser. Enter coordinates manually.";
                return;
            }
            byId("academy-live-readout").textContent = "Requesting location permission…";
            navigator.geolocation.getCurrentPosition(position => {
                byId("academy-latitude").value = position.coords.latitude.toFixed(4);
                byId("academy-longitude").value = position.coords.longitude.toFixed(4);
                renderLiveReadout();
            }, error => {
                const message = error.code === error.PERMISSION_DENIED
                    ? "Location permission was denied. Enter coordinates manually if you want to use this demonstration."
                    : error.code === error.TIMEOUT
                        ? "Location request timed out. Try again or enter coordinates manually."
                        : "Could not determine location. Enter coordinates manually.";
                byId("academy-live-readout").textContent = message;
            }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
        });
        ["academy-latitude", "academy-longitude", "academy-observe-time"].forEach(id => byId(id).addEventListener("change", renderLiveReadout));
        byId("academy-compass-time").addEventListener("input", event => {
            const degrees = Math.round(Number(event.target.value) * 3.6);
            byId("academy-compass-star-trail").style.setProperty("--sky-angle", `${degrees}deg`);
            byId("academy-compass-time-output").textContent = `${degrees}° · Stars appear to drift westward`;
        });
    }

    function initialize() {
        const canvas = byId("academy-star-canvas");
        if (!canvas) return;
        canvasContext = canvas.getContext("2d");
        if (!canvasContext) {
            byId("academy-map-error").hidden = false;
            byId("academy-map-error").textContent = "This browser could not create the star chart canvas.";
            return;
        }
        renderConstellationSelect();
        renderDiscovery();
        renderFacts();
        renderProgress();
        renderConstellationList();
        renderPlanet();
        renderLessonList();
        renderLesson();
        renderChallengeList();
        renderChallenge();
        renderQuiz();
        byId("academy-observe-time").value = localDateTimeValue(new Date());
        renderLiveReadout();
        bindEvents();
        selectConstellation(activeConstellation.id);
        window.addEventListener("resize", renderStarChart);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
}());
