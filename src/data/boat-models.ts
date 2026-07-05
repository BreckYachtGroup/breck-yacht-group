/**
 * BOAT_MODELS
 * Maps popular boat makes to their known model lines.
 * Used by the valuation tool model autocomplete dropdown.
 * Falls back to free-text input for makes not listed here.
 */
export const BOAT_MODELS: Record<string, string[]> = {
  // ── Center Console / Inshore ───────────────────────────────────────────────
  'Sportsman': [
    '17 Island Bay', '19 Island Bay', '192 Open', '194 Open',
    '202 Open', '204 Open', '212 Open', '214 Open',
    '224 Open', '232 Open', '234 Open', '244 Open',
    '247 Center Console', '252 Open', '257 Center Console',
    '262 Open', '267 Center Console', '282 Center Console',
    '287 Center Console', '292 Open', '302 Open', '312 Open',
  ],
  'Boston Whaler': [
    '110 Montauk', '130 Super Sport', '150 Super Sport',
    '170 Montauk', '170 Super Sport', '190 Montauk', '200 Montauk',
    '210 Montauk', '220 Dauntless', '230 Dauntless', '230 Vantage',
    '240 Dauntless', '250 Dauntless', '270 Dauntless', '280 Dauntless',
    '285 Conquest', '300 Outrage', '315 Conquest', '320 Outrage',
    '330 Outrage', '345 Conquest', '350 Outrage', '380 Outrage',
    '405 Conquest', '420 Outrage',
  ],
  'Grady-White': [
    '170 Montego', '180 Fisherman', '191 Tournament', '205 Tournament',
    '209 Escape', '215 Freedom', '220 Bimini', '225 Freedom',
    '230 Tourney', '232 Gulfstream', '235 Freedom', '248 Voyager',
    '251 Coastal Explorer', '257 Sailfish', '262 Sailfish',
    '265 Freedom', '271 Canyon', '272 Sailfish', '275 Freedom',
    '277 Sailfish', '280 Marlin', '282 Sailfish', '285 Freedom',
    '290 Marlin', '300 Marlin', '305 Freedom', '306 Bimini',
    '325 Freedom', '330 Express', '336 Canyon', '370 Express', '376 Canyon',
  ],
  'Invincible': [
    '27 Open Fisherman', '33 Open Fisherman', '35 Open Fisherman',
    '37 Open Fisherman', '39 Open Fisherman', '40 Catamaran',
    '42 Open Fisherman', '46 Catamaran',
  ],
  'Yellowfin': [
    '17', '19', '21', '21 Hybrid', '24', '25', '26', '26 Hybrid',
    '27', '28', '32', '34', '36', '39', '42',
  ],
  'Freeman': [
    '34 VH', '34 VHP', '36 VH', '37 VH', '38 VH', '42 VH',
  ],
  'Contender': [
    '17 Sport', '19 Sport', '23 Sport', '23 Tournament',
    '24 Sport', '25 Sport', '25 Tournament', '27 Open',
    '27 Tournament', '28 Open', '28 Sport', '30 Tournament',
    '31 Fish Around', '33 Tournament', '35 Tournament',
    '37 Tournament', '39 Tournament', '44 ST',
  ],
  'Regulator': [
    '23', '25', '26', '28', '31', '34', '41',
  ],
  'Scout': [
    '150 XSF', '155 Dorado', '160 Dorado', '175 Dorado', '177 Sportfish',
    '187 Dorado', '195 Dorado', '197 Sportfish', '200 Dorado', '202 Dorado',
    '207 Dorado', '210 XSF', '220 XSF', '221 XSF', '225 Dorado',
    '230 Dorado', '235 Dorado', '240 XSF', '245 Dorado', '250 Dorado',
    '255 XSF', '260 Dorado', '262 Dorado', '263 Abaco', '265 Dorado',
    '270 Dorado', '275 Dorado', '280 Dorado', '300 LXF', '355 LXF',
    '380 LXF', '420 LXF',
  ],
  'Cobia': [
    '180 CC', '201 CC', '220 CC', '240 CC', '261 CC',
    '280 CC', '301 CC', '320 CC', '330 CC', '350 CC',
  ],
  'Sea Hunt': [
    'Ultra 185', 'Ultra 195', 'Ultra 211', 'Ultra 225',
    'Ultra 234', 'Ultra 235', 'Ultra 255',
    'Escape 234', 'Escape 254',
    'Gamefish 235', 'Gamefish 275', 'Gamefish 320',
    'BX 22 BR', 'BX 24 BR',
  ],
  'Robalo': [
    'R160', 'R180', 'R200', 'R222', 'R227',
    'R230', 'R247', 'R260', 'R272', 'R305',
  ],
  'Mako': [
    '18 LTS', '19 CPX', '21 LTS', '21 CPX', '216 CC',
    '224 CC', '228 CC', '234 CC', '238 CC', '252 CC',
    '254 CC', '264 CC', '284 CC', '304 CC', '334 CC', '404 CC',
  ],
  'Pursuit': [
    '180 CC', '190 CC', '200 CC', '200 DC',
    '215 CC', '220 Bay', '230 CC', '248 CC',
    '2655 Offshore', '288 Sport', '3070 Offshore',
    '325 Offshore', '408 Sport', '450 Sport',
  ],
  'Everglades': [
    '110 CC', '130 CC', '200 CC', '210 CC', '230 CC',
    '243 CC', '243 FS', '253 CC', '253 FS',
    '273 CC', '323 CC', '355 CC', '395 CC', '435 CC',
  ],
  'Edgewater': [
    '205 CC', '228 CC', '245 CC', '265 CC',
    '280 CC', '298 CC', '318 CC',
  ],
  'Key West': [
    '176 CC', '176 DC', '189 CC', '189 DC',
    '203 CC', '203 DC', '219 CC', '219 FS',
    '230 CC', '239 CC', '239 FS',
    '261 CC', '261 CE', '261 DC', '281 CE',
  ],
  'Sea Fox': [
    '168 Commander', '186 Commander', '199 Commander', '228 Commander',
    '249 Commander', '268 Commander', '288 Commander',
    '320 Voyager', '328 Commander',
  ],
  'Pathfinder': [
    '2200 TRS', '2300 HPS', '2400 TRS', '2600 TRS',
    '2800 DC', '2500 HPS', '2700 DC',
  ],
  'Tidewater': [
    '198 CC Adventure', '216 CC Adventure', '220 CC Adventure',
    '228 CC Adventure', '230 CC Adventure', '252 CC Adventure',
    '280 CC Adventure', '302 CC Adventure',
  ],
  'Ranger': [
    '185 Reata', '195 Reata', '220 Reata', '2360 Bay',
    '2460 Bay', '2510 Bay', '2610 Bay',
  ],
  'Sea Pro': [
    '172 CC', '182 CC', '208 CC', '218 CC',
    '228 CC', '239 CC', 'SW 239', 'SW 259',
  ],
  // ── Sportfish / Convertible ────────────────────────────────────────────────
  'Viking': [
    '32 Open', '37 Billfish', '38 Billfish',
    '40 Convertible', '42 Convertible', '44 Convertible', '44 Open',
    '46 Convertible', '48 Convertible', '48 Open',
    '52 Convertible', '52 Open', '54 Convertible',
    '55 Open', '57 Convertible', '58 Convertible',
    '62 Convertible', '62 Open', '64 Convertible',
    '68 Convertible', '72 Convertible', '80 Convertible',
    '90 Convertible',
  ],
  'Hatteras': [
    '36 Convertible', '40 Convertible', '45 Express',
    '45EX', '46 Convertible', '50EX', '54 Convertible',
    '54EX', '58EX', '60EX', '63 Convertible',
    '65 Convertible', '70 Convertible', '72EX', '77EX',
  ],
  'Bertram': [
    '28 Sport Bridge', '30 Moppie', '31 Flybridge Cruiser',
    '33 Sport Bridge', '35 Convertible', '37 Convertible',
    '390 Convertible', '42 Convertible', '450 Convertible',
    '510 Convertible', '570 Convertible', '630 Convertible',
    '670 Convertible', '700 Convertible',
  ],
  'Cabo': [
    '25 Express', '31 Express', '32 Express', '35 Express',
    '38 Express', '40 Express', '43 Flybridge', '44 Flybridge',
    '45 Express', '48 Convertible',
  ],
  'Rybovich': [
    '36 Sportfish', '38 Sportfish', '40 Sportfish', '42 Sportfish',
    '44 Sportfish', '46 Sportfish', '50 Sportfish',
  ],
  'Buddy Davis': [
    '38 Sportfish', '42 Sportfish', '44 Sportfish',
    '47 Sportfish', '52 Sportfish', '61 Sportfish',
  ],
  'Post': [
    '33 Sport Fisherman', '36 Sport Fisherman', '40 Sport Fisherman',
    '42 Sport Fisherman', '43 Sport Fisherman', '46 Sport Fisherman',
  ],
  'Merritt': [
    '37 Center Console', '40 Center Console', '43 Center Console',
    '46 Center Console', '50 Center Console', '54 Center Console',
    '58 Center Console',
  ],
  'Garlington': [
    '35 CC', '39 CC', '42 CC', '45 CC',
    '47 CC', '55 CC', '63 CC',
  ],
  'Striker': [
    '32 Convertible', '35 Convertible', '38 Convertible',
    '44 Convertible', '46 Convertible', '54 Convertible',
  ],
  'Topaz': [
    '25 Sportsman', '29 Sportsman', '32 Royale', '36 Sportsman',
    '40 Sportsman', '43 Sportsman',
  ],
  'Paul Mann': [
    '36 Custom', '40 Custom', '42 Custom', '46 Custom', '50 Custom',
  ],
  'Winter Custom Yachts': [
    '33 CC', '35 CC', '38 CC', '40 CC', '42 CC', '46 CC',
  ],
  'Jarvis Newman': [
    '36 Express', '40 Express', '43 Express', '46 Express',
  ],
  'Spencer': [
    '42 Express', '44 Express', '46 Express', '50 Express',
    '52 Express', '56 Express', '60 Express',
  ],
  'Jim Smith': [
    '36 CC', '40 CC', '42 CC', '44 CC', '46 CC',
  ],
  'Jarrett Bay': [
    '35 Sportfish', '46 Boatworks', '48 Boatworks',
    '52 Boatworks', '58 Boatworks', '64 Boatworks',
  ],
  'Davis': [
    '65 Custom', '70 Custom', '72 Custom',
  ],
  // ── Luxury Motor Yachts ────────────────────────────────────────────────────
  'Ferretti': [
    '450', '500', '550', '580', '600', '650', '670', '720', '780', '850', '920',
  ],
  'Ferretti Yachts': [
    '450', '500', '550', '580', '600', '650', '670', '720', '780', '850', '920',
  ],
  'Sunseeker': [
    '55 Camargue', '68 Sport Yacht', '74 Yacht', '86 Yacht', '88 Yacht',
    '90 Ocean', '95 Yacht', '100 Yacht', '115 Sport Yacht', '131 Yacht',
    'Manhattan 52', 'Manhattan 55', 'Manhattan 60', 'Manhattan 65',
    'Predator 57', 'Predator 68', 'Predator 74', 'Predator 80',
  ],
  'Princess': [
    'F45', 'F50', 'F55', 'F62', 'F70',
    'V48', 'V55', 'V60', 'V65',
    'Y72', 'Y85', 'Y95',
    '39', '45', '52', '58', '64', '72', '82', '88', '95',
  ],
  'Pershing': [
    '5X', '6X', '7X', '8X', '9X', '54', '62', '70',
    '72', '74', '82', '85', '90', '92', '108',
  ],
  'Riva': [
    'Aquariva', 'Rivamare', 'Rivale', 'Iseo', 'El-Iseo',
    'Dolceriva', 'Sportriva', 'Ribelle', 'Verso',
    '56 Rivale', '66 Ribelle', '68 Diable', '76 Perseo',
    '88 Florida', '90 Argo', '100 Corsaro', '110 Dolcevita',
  ],
  'Azimut': [
    'S6', 'S7', 'S8', '40', '43', '45', '50',
    '53', '55', '58', '60', '64', '66', '68',
    '70', '72', '74', '78', '80', '100', '116 Grande',
  ],
  'Sanlorenzo': [
    'SL78', 'SL86', 'SL92', 'SL96', 'SL102', 'SL108',
    'SL118', 'SL120', 'SX60', 'SX66', 'SX76', 'SX88', 'SX100',
    'SD90', 'SD96', 'SD112', 'SD122',
    'X Space', '500EXP',
  ],
  'Monte Carlo Yachts': [
    'MCY 65', 'MCY 70', 'MCY 76', 'MCY 80', 'MCY 86', 'MCY 96', 'MCY 105',
  ],
  'Numarine': [
    '12XP', '22XP', '26XP', '32XP', '55HT', '65HT', '78HT',
  ],
  'Mangusta': [
    '72', '80 Open', '92', '94', '98', '104 REV', '108 REV', '116 REV',
  ],
  'Cranchi': [
    'E26', 'E30', 'E30 Rider', 'E34', 'E40', 'E44',
    'M44 HT', 'M52 HT', 'Settantotto 78',
  ],
  'Lurssen': [
    'Custom 50m', 'Custom 60m', 'Custom 70m', 'Custom 80m',
  ],
  'Westport': [
    '112', '125', '130', '164', '172',
  ],
  'Feadship': [
    'Custom', 'Semi-Custom',
  ],
  'Heesen': [
    'Custom 30m', 'Custom 40m', 'Custom 50m', 'Custom 55m',
  ],
  // ── Performance / Go-Fast ──────────────────────────────────────────────────
  'Cigarette': [
    '38 Top Gun', '39 Top Gun', '41 Top Gun', '42 Top Gun',
    '45 Top Gun', '46 Top Gun', '515 Top Gun', '59 Plane Jane',
  ],
  'Fountain': [
    '32 Lightning', '35 Lightning', '38 Lightning', '42 Lightning',
    '47 Lightning', '48 Lightning', '52 Lightning',
  ],
  'Formula': [
    '200 SS', '232 SS', '240 SS', '270 SS', '290 SS', '310 SS',
    '330 SS', '350 SS', '370 SS', '400 SS', '430 SS',
    '350 FX', '400 FX', '430 FX', '500 FX',
  ],
  'Scarab': [
    '165 ID', '195 ID', '215 ID', '235 ID', '255 ID',
  ],
  'Donzi': [
    '22 Classic', '26 ZX', '28 ZF', '29 Classic', '38 ZRX',
  ],
  'Midnight Express': [
    '37 Center Console', '39 Center Console',
    '39 Open', '43 Open',
  ],
  'Nor-Tech': [
    '340 Center Console', '390 Center Console',
    '392 Super Fish', '450 CC', '480 CC', '5000 Supercat',
  ],
  'Glasstream': [
    '239 SCX', '255 CCX', '259 CCX', '275 CCX', '295 SCX',
  ],
  'Statement': [
    '389 CC',
  ],
  // ── Cruisers / Express ────────────────────────────────────────────────────
  'Sea Ray': [
    '190 SPX', '190 SLX', '205 Sport', '210 SPX', '230 SLX',
    '250 SLX', '270 SLX', '290 SLX', '310 SLX', '350 SLX',
    '370 Venture', '400 SLX', '460 Sundancer', '520 Sundancer',
    'L550 Fly', 'L590 Fly', 'L650 Fly',
  ],
  'Chaparral': [
    '18 H2O', '19 H2O', '20 H2O', '21 H2O', '21 Vortex',
    '22 SSi', '223 Vortex', '25 Vortex', '26 Signature',
    '28 Signature', '287 SSX', '30 Signature', '21 Sunesta',
    '23 Sunesta', '26 Sunesta', '30 Sunesta',
  ],
  'Regal': [
    '19 OBX', '26 OBX', '28 Express', '33 Express',
    '35 Sport Coupe', '38 Grande Coupe', '42 Grande Coupe',
  ],
  'Cobalt': [
    'A25', 'A29', 'CS23', 'CS25', 'CS3', 'CS35',
    'R3', 'R5', 'R7', 'R30', 'R35', 'R40',
  ],
  'Four Winns': [
    'H1', 'H3', 'H5', 'H7', 'H9',
    'V255', 'V305', 'V375',
  ],
  'Wellcraft': [
    '180 Fisherman', '210 Fisherman', '232 Coastal', '252 Coastal',
    '270 Coastal', '290 Coastal', '350 Coastal',
  ],
  'Chris-Craft': [
    'Calypso 26', 'Catalina 29', 'Commander 42',
    'Launch 19', 'Launch 23', 'Launch 25', 'Launch 28', 'Launch 30',
    'Corsair 25',
  ],
  'Cruisers Yachts': [
    '238 Bow Rider', '260 Bow Rider', '338 Express', '390 Express',
    '45 Cantius', '46 Cantius', '50 Cantius', '55 Cantius',
    '60 Cantius', '60 Fly', '65 Fly',
  ],
  // ── Pontoons ───────────────────────────────────────────────────────────────
  'Bennington': [
    '20 SFV', '21 SLXFB', '22 SLXFB', '22 SX', '23 SRX',
    '23 SSRX', '24 QX', '24 RSR', '25 QX', '25 QXFB',
    '26 QX', '27 QX', '28 QX', '30 QX',
  ],
  'Manitou': [
    '18 SES', '20 XT', '21 XT', '22 SES', '23 SES',
    '23 SRS', '25 SRS Aurora', '25 VP', '27 SRS Aurora',
  ],
  'Barletta': [
    'C20UC', 'C22UC', 'C22QC', 'C24UC', 'C24QC',
    'E22QC', 'E24QC', 'E25QC',
    'L23QC', 'L25QC',
  ],
  'Sun Tracker': [
    'Bass Buggy 16', 'Bass Buggy 18', 'Bass Buggy 20',
    'Fishin\' Barge 20', 'Fishin\' Barge 22', 'Fishin\' Barge 24',
    'Party Barge 20', 'Party Barge 22', 'Party Barge 24',
  ],
  // ── Catamarans ────────────────────────────────────────────────────────────
  'Lagoon': [
    '380', '400', '410', '420', '440', '450', '450S', '450F',
    '500', '520', '560', '620', '630', '650', '700',
  ],
  'Fountaine Pajot': [
    'Isla 40', 'Lucia 40', 'Astrea 42', 'Elba 45', 'Saba 50',
    'Alegria 67', 'Tanna 47', 'Aura 51', 'New 45', 'MY 44',
    'MY 4.S', 'MY 47',
  ],
  'Privilege': [
    '395', '435', '465', '485', '510',
  ],
  'Leopard': [
    '38', '40', '42', '43', '45', '46', '50', '58',
    '40 Power Cat', '43 Power Cat', '51 Power Cat',
  ],
  'World Cat': [
    '235 CC', '255 CC', '270 TE', '295 CC', '320 CC DC',
  ],
  // ── Trawlers / Long Range ─────────────────────────────────────────────────
  'Nordhavn': [
    '35', '40', '43', '46', '47', '52', '55', '57', '60',
    '62', '63', '68', '72', '76', '80', '86', '96', '120',
  ],
  'Kadey-Krogen': [
    '33', '38 AE', '39', '42', '44', '48', '50', '52',
    '54 Open', '58', '65', 'Krogen 42', 'Krogen 48',
  ],
  'Ocean Alexander': [
    '60 Motoryacht', '64 Motoryacht', '70 MkII',
    '72 Motoryacht', '84e', '85e', '90R', '94R', '100R',
  ],
  'Grand Banks': [
    '32 Sedan', '36 Heritage EU', '36 Heritage TC', '40 Heritage EU',
    '40 Heritage TC', '42 Classic', '43 Heritage EU', '45 Heritage EU',
    '46 Heritage EU', '47 Heritage EU', '54 Motoryacht', '59 Aleutian RP',
  ],
  'DeFever': [
    '40', '41', '44', '46', '48', '52', '53', '57', '60',
  ],
  'Selene': [
    '34', '36 Trawler', '40 Ocean Trawler', '43 Trawler',
    '47 Trawler', '53 Pilothouse', '57 Pilothouse', '60 Pilothouse',
  ],
  // ── PWC / Tender ──────────────────────────────────────────────────────────
  'Yamaha Boats': [
    'AR190', 'AR210', 'AR240', 'SR210', 'SR230', 'SX190', 'SX210', 'SX240',
    'F1B', 'FSH 190', 'FSH 210', 'FSH 210 Sport', 'FSH 255',
  ],
  'Sea-Doo': [
    'GTI 90', 'GTI 130', 'GTI SE 130', 'GTI SE 170', 'GTI Pro 130',
    'GTR 230', 'GTX 170', 'GTX 230', 'GTX 300', 'GTX Limited 300',
    'RXP-X 300', 'RXT 230', 'RXT-X 300', 'Spark', 'Spark Trixx',
    'Wake 170', 'Wake Pro 230',
  ],
  // ── Skiffs / Bay Boats ────────────────────────────────────────────────────
  'Maverick': [
    '17 Mirage', '18 Mirage', '21 Mirage', '17 HPX-S',
    '17 HPX-V', '18 HPX-S', '18 HPX-V',
  ],
  'Hewes': [
    '16 Bayfisher', '16 Bonefisher', '17 Bonefisher',
    '18 Bonefisher', 'Redfisher 16', 'Redfisher 17', 'Redfisher 18',
  ],
  'Hell\'s Bay': [
    'Glades 15', 'Glades 16', 'Marquesa 17', 'Marquesa 18',
    'Professional', 'Whipray', 'Estero',
  ],
  'Ankona': [
    '14 Bayou', '15 Bay Bird', '15 Native', '16 Copperhead',
    '17 Copperhead', '18 Copperhead', 'Native',
  ],
  'Mitzi Skiffs': [
    '14 Skiff', '17 Skiff', '18 Skiff', '20 Skiff',
  ],
  'Action Craft': [
    '1720 Flatmaster', '1820 Flatmaster', '2220 Flyfisher',
    '2120 Inshore', '2220 Inshore',
  ],
  // ── Aluminum Fishing ──────────────────────────────────────────────────────
  'Alumacraft': [
    '1436', '1448', '1648', '1750', '1756', '1860',
    'Classic 165', 'Classic 165 CS', 'Competitor 165',
    'Escape 165', 'Escape 145',
  ],
  'Lund': [
    '1400 Angler', '1400 Fury', '1600 Angler', '1625 Fury SS',
    '1600 Rebel XL', '1875 Explorer SS', '2025 Explorer SS',
    'Pro-V 2075', 'Pro-V 2175', 'Tyee 1975',
  ],
  'Tracker': [
    'Bass Tracker Classic XL', 'Bass Tracker Pro 160', 'Pro 160',
    'Pro 170', 'Pro Guide V-16', 'Pro Guide V-175',
    'Pro Guide V-195 SC', 'Targa V-18 Combo',
  ],
  // ── Inflatable / RIB ──────────────────────────────────────────────────────
  'Zodiac': [
    'Cadet 230', 'Cadet 310', 'Zoom 310', 'Zoom 360',
    'Pro Open 420', 'Pro 500', 'Pro Classic 500',
    'Medline II', 'Milpro',
  ],
  'Highfield': [
    'Classic 290', 'Classic 310', 'Classic 340', 'Classic 380',
    'Ocean Master 500', 'Ocean Master 540', 'Ocean Master 580',
    'Sport 460',
  ],
  // ── Sailing ───────────────────────────────────────────────────────────────
  'Beneteau': [
    'Oceanis 30.1', 'Oceanis 34.1', 'Oceanis 38.1', 'Oceanis 40.1',
    'Oceanis 46.1', 'Oceanis 51.1', 'Oceanis 55', 'Oceanis 60',
    'First 24', 'First 27', 'First 36', 'First 44',
    'Antares 11', 'Swift Trawler 35', 'Swift Trawler 41',
  ],
  'Jeanneau': [
    'Sun Odyssey 319', 'Sun Odyssey 349', 'Sun Odyssey 380',
    'Sun Odyssey 389', 'Sun Odyssey 410', 'Sun Odyssey 440',
    'Sun Odyssey 490', 'Sun Odyssey 519',
    'Leader 7.5', 'Leader 9', 'Leader 10',
  ],
  'Catalina': [
    '22', '270', '309', '315', '320', '355', '385', '400', '425',
  ],
  'Hunter': [
    '23.5', '31', '33', '36', '38', '41', '45', '49',
  ],
  'Island Packet': [
    '31', '35', '38', '40', '420', '45', '470', '485', '525',
  ],
  'Pacific Seacraft': [
    '25', '28', '31', '34', '37', '40', '44',
  ],
  'Hanse': [
    '315', '348', '388', '418', '418', '458', '460',
    '508', '548', '588', '630', '675',
  ],
  'Bavaria': [
    'C37', 'C42', 'C45', 'C50', 'C57', 'C65',
    'Vision 42', 'Vision 46',
  ],
  'Hallberg-Rassy': [
    '310', '340', '340', '372', '40', '412', '43', '44',
    '48 MkIII', '49', '55', '57', '64', '69',
  ],
  'Oyster': [
    '445', '475', '495', '565', '595', '625', '675', '825', '885',
  ],
  // ── Jet Skis ──────────────────────────────────────────────────────────────
  'Kawasaki': [
    'Ultra 310LX', 'Ultra 310R', 'Ultra 160LX', 'STX-160',
    'STX-160LX', 'STX-160X', 'SX-R 160',
  ],
}
