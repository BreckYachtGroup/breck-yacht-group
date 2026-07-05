'use client'

/**
 * /sell/value-my-vessel
 *
 * Two-panel valuation page:
 * Left  — AI Instant Estimate (comp-based, live MLS data)
 * Right — Request a Broker Quote (manual, emails Austin within 24hrs)
 *
 * Lead gate: show price range teaser immediately, lock full breakdown
 * behind name + email capture. Gate submit emails Austin via /api/valuation.
 */

import { useState, useEffect, useRef } from 'react'
import ValuationForm from '@/components/ValuationForm'
import { BOAT_MODELS } from '@/data/boat-models'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

// ── Types ──────────────────────────────────────────────────────────────────────

interface CompRow {
  name: string; year: number; make: string; model: string
  length_ft: number; hours: number; price: number; location: string
  url: string | null
}

interface ValuationResult {
  low: number; mid: number; high: number
  confidence: 'high' | 'medium' | 'low'
  comp_count: number; comps: CompRow[]
  methodology: string
  engine_breakdown?: unknown // internal only — not displayed on public page
}

type Stage = 'input' | 'teaser' | 'unlocked'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => CURRENT_YEAR - i)

const BOAT_MAKES = [
  // ── A ─────────────────────────────────────────────────────────────────────
  '2 Bar', '3B Craft', '3D Tender',
  'A&M Manufacturing', 'A-Yachts', 'Aage Nielsen', 'AB', 'AB Inflatables', 'AB Yachts',
  'Abaco', 'Abaco Skiff', 'Abacus', 'Abati Yachts', 'Abbott', 'ABD',
  'Abeking & Rasmussen', 'Abim', 'Able', 'Absolute', 'ACB', 'Accelera', 'Achilles', 'ACM',
  'Acroplast', 'Action Craft', 'Activator', 'Active Thunder', 'Ad Astra', 'Ada Yacht',
  'Adagio', 'Adler', 'Admiral', 'AdmiralsTender', 'Adonia', 'Adrenaline', 'Adria',
  'Advanced Yachts', 'Advantage', 'Adventure', 'Adventure Craft', 'Adventure Yachts',
  'Aegean Yacht', 'Aermarine', 'AES Yacht', 'Africat Marine', 'Aftershock',
  'Aganlar', 'Agapi', 'Agder', 'Agilis', 'Aiata', 'Aicon', 'Airboat', 'Airon',
  'AirRib', 'Airship', 'Airsolid', 'AKA Marine', 'Akerboom',
  'Al Dhaen', 'Al Rubban Marine', 'Al Shaali', 'Alajuela', 'Alalunga', 'Alan Pape',
  'Alaska', 'Alaskan', 'ALB Sail', 'Albatro', 'Albatross', 'Albemarle', 'Alberg', 'Albin',
  'Albury Brothers', 'Alcan', 'AlCustom', 'Alden', 'Alen', 'Alena', 'Alera', 'Alerion',
  'Aleutian', 'Alfa', 'Alfamarine', 'Alfastreet', 'Alia Yachts', 'Alibi',
  'ALK2 Powerboats', 'Allegra', 'Allegro Yacht', 'Alliage', 'Alliaura', 'Allied',
  'Allison', 'Allison Boats', 'Allmand', 'Alloy Yachts', 'AllSea', 'Allseas',
  'Allure', 'Allures', 'Alm', 'Almar', 'Almarine', 'Aloha', 'Alpa', 'Alpha',
  'Alsberg Brothers', 'Altair', 'Altamar', 'Altamarea', 'Altena', 'Altima', 'Altura',
  'Alu Marine', 'Alubat', 'Alukin', 'Alumacraft', 'Alumarine', 'Alumaweld',
  'Aluminum Cruiser', 'Alva Yachts', 'Alweld', 'Amarès', 'Amel', 'Amels', 'Amer',
  'AmeraCat', 'Amerglass', 'American', 'American Custom Catamarans', 'American Marine',
  'American Sail', 'American Tug', 'AMP', 'AMS Marine', 'Andaman', 'Andrews', 'Andros',
  'Angel', 'Angler', 'Angler Quest', 'Angler Qwest', 'Anker & Jensen', 'Ankertrawler',
  'Ankona', 'Antago', 'Antares', 'Antaris', 'Anthem', 'Antigua', 'Antonini Navi',
  'Anvera', 'Anytec', 'AP Yachting', 'Apache', 'Apex', 'Apex Marine', 'Apex Qwest',
  'Apex Yachts', 'Aphrodite', 'Apollo', 'Apollonian Yachts', 'Apreamare',
  'Aqua', 'Aqua Chalet', 'Aqua Cycle', 'Aquabat', 'Aquabay', 'Aquador', 'Aquafibre',
  'Aquafish', 'Aquaform', 'Aqualine', 'Aqualum', 'Aquamar', 'Aquamarine', 'Aquanaut',
  'AquaPatio', 'Aquapro', 'Aquaspirit', 'Aquasport', 'Aquastar', 'Aquatron', 'Aquaviva',
  'Aquila', 'Aquitalia', 'Aqvaboats', 'Arc', 'Arcadia Yachts', 'Archambault',
  'Archipelago', 'Arcoa', 'Arcona', 'Arctic Blue', 'Aresa', 'Argo', 'Argo Navis',
  'Argonaut', 'Argos', 'Arie Wiegmans', 'Aries', 'Arima', 'Arimar', 'Arkin Pruva',
  'Arkos', 'Arksen', 'Armada', 'Armon', 'Armstrong Marine', 'Arno Leopard', 'Aron',
  'Arran', 'Arronet', 'Arrow Boats', 'ArrowCat', 'ARS Monaco', 'Artaban', 'Artemis',
  'Arvor', 'AS', 'Asante', 'Ascend', 'Askeladden', 'Asloep', 'Aspen', 'Aspre', 'Asso',
  'Astec', 'Asterie', 'Astilleros', 'Astilux', 'Astinor', 'Astondoa', 'Astor', 'Astro',
  'Astromar', 'Astus', 'Atender', 'Atkin', 'Atlanta', 'Atlantic', 'Atlantic City',
  'Atlantic Marine', 'AtlantiCraft', 'Atlantis', 'Atlas Boat Works', 'ATX Surf Boats',
  'Aubin', 'Austal', 'Austin Parker', 'AvA Yachts', 'Avalon', 'Avance', 'Avanti',
  'Avenger', 'Aventura', 'Aviara', 'Avid', 'Avon', 'Awave', 'Axis', 'Axopar', 'Ayros',
  'Azimut', 'Aztec', 'Azure', 'Azuree', 'Azzura', 'Azzurro',
  // ── B ─────────────────────────────────────────────────────────────────────
  'B-Craft', 'B-Yachts', 'B2 Marine', 'Baal', 'Baba', 'Babro', 'Back Country', 'Back Cove',
  'Baglietto', 'Baha', 'Baha Cruisers', 'Bahama', 'Baia', 'Baja', 'Baja Panga',
  'Bakdekker', 'Bakdekkruiser', 'Bakewell-White', 'Balance', 'Bali', 'Balise', 'Ballistic',
  'Ballotta', 'Balt Yacht', 'Baltec', 'Baltic', 'Baltra', 'Bandido', 'Bandit', 'Bani',
  'Banjer', 'Banks Panga', 'Banner', 'Barattucci', 'Barbaros', 'Barbary', 'Barberis',
  'Baretta', 'Barge', 'Barkas', 'Barker Boatworks', 'Barletta', 'Barnett', 'Baron',
  'Barracuda', 'Bashford', 'Bass Cat', 'Bass Tracker', 'Bat', 'Bates', 'Baumarine',
  'Bavaria', 'Bay Rider', 'Bay Stealth', 'Bayfield', 'Bayliner', 'Bayview Boats', 'BB Yachts',
  'Beachcat', 'Beachcraft', 'Beacher', 'Beaver Yachts', 'Beavertail Skiffs', 'Bee', 'Bee Line',
  'Beenhakker', 'Bege', 'Beja', 'Bekebrede', 'Bekkers Yachts', 'Belassi', 'Belize', 'Bella',
  'Bellini', 'Belliure', 'Bellus', 'Belzona', 'Ben Lexcen', 'Bendie', 'Beneteau', 'Benetti',
  'Benetti Sail Division', 'Benford', 'Bennington', 'Bente', 'Bentley Pontoons', 'Berckemeyer',
  'Bergumermeer', 'Bering', 'Bering Marine', 'Berkshire', 'Bernico', 'Berthon', 'Bertram',
  'Bestevaer', 'BHM', 'Biam', 'Bianca', 'Big O', 'Bilgin', 'Bill Lee Yachts', 'Billfish',
  'Billie Marine', 'Bimini', 'Birchwood', 'Birdsall', 'Black by 3BBB', 'Black Horse',
  'Black Pepper', 'Black Thunder', 'Black Watch', 'Blackfin', 'BlackJack', 'Blackman',
  'Blackwater', 'Blackwell', 'Blackwood', 'Blanchard', 'Blaundus', 'Blauwe Hand', 'Blazer',
  'Bloemsma', 'Bloemsma and Balk', 'Blohm & Voss', 'Blount', 'Blu Martin Yachts', 'Blue Fin',
  'Blue Ice', 'Blue Ocean', 'Blue Seas', 'Blue Spirit', 'Blue Water', 'Blue Wave', 'Bluegame',
  'Bluenose', 'Bluewater', 'Bluewater Sportfishing', 'Bluewater Yachts', 'Bluewhale', 'Blumax',
  'BMA', 'Boarncruiser', 'Boarnstream', 'Boatyard', 'Bobsloepen', 'Boca Bay', 'Boca Grande',
  'Boden', 'Bodrum', 'Boeing', 'Boesch', 'Bola', 'Bold', 'Bomb Island', 'Bombard',
  'Bombardier', 'Bonadeo', 'Bonafide', 'Bonanza', 'Bondway', 'Bonefish', 'Bonin', 'Bonita',
  'Boreal', 'Bossman', 'Boston Whaler', 'Botnia', 'Botter', 'Boulton', 'Bounty', 'Bowman',
  'BRABUS', 'Bracewell', 'Brady', 'Brandaris', 'Brandsma', 'Bravada', 'Bravura',
  'Bray Yacht Design',
  'Breaux\'s Bay Craft', 'Breaux Brothers', 'Breedendam', 'Breehorn', 'Brema', 'Breva',
  'Brewer', 'Brig', 'Bristol', 'Bristol Channel Cutter', 'Bristol Harbor', 'British Hunter',
  'Brix Marine', 'Brizo', 'Broadblue', 'Broadwater Boatworks', 'Broesder Kotter',
  'Brooke Marine', 'Brooklin Boat Yard', 'Broom', 'Broward', 'Brownell', 'Bruce Kirby',
  'Bruce Roberts', 'Bruckmann', 'Bruijs', 'Brument', 'Bruno & Stillman', 'Bruno Abbate',
  'Bryant', 'BSC', 'BSD Yachting', 'BSY', 'Buccaneer', 'Buckley Yacht Design',
  'Buddy Cannady', 'Buddy Davis', 'Buehler Turbocraft', 'Bueltjer', 'Bugari', 'Buizen',
  'Bulldog', 'Bullet', 'Bullfrog', 'Bulls Bay', 'Bully', 'Bumble Bee', 'Bunker and Ellis',
  'Bura', 'Burger', 'Burmester', 'Burns Craft', 'Buster', 'Buzzards Bay', 'BWA', 'Bützfleth',
  // ── C ─────────────────────────────────────────────────────────────────────
  'C&C', 'C & L', 'C-Catamarans', 'C-Dory', 'C-Hawk', 'C-Kip', 'C-Tender', 'C-Yacht',
  'C.Boat', 'C.W. Hood', 'Cabo', 'Cabo Rico', 'Cadenazzi', 'Cadorette', 'CAL', 'Calabria',
  'Calafuria', 'Calcutta', 'Caliber', 'Caliber 1', 'Californian', 'Calkins', 'Callisto',
  'Calvin Beal', 'Calypso', 'Camano', 'Camargue', 'Cambria', 'Camden', 'Cammenga',
  'Camper & Nicholsons', 'Campion', 'Camuffo', 'Canadian Sailcraft', 'Canados', 'Canal Boat',
  'Canard Yachts', 'Canaveral', 'Candela', 'Canelli', 'Canoe Cove', 'Cantiere Delle Marche',
  'Cantieri di Pisa', 'Cantieri di Sarnico', 'Cantieri Estensi',
  'Cantieri Navali del Mediterraneo', 'Cantieri Navali di Livorno', 'Cantieri Navali Liguri',
  'Cantieri Nord Est', 'Cantieri Tirrenia', 'Cantieri Venere', 'Canyon Bay',
  'Cape Cod Shipbuilding', 'Cape Codder', 'Cape Craft', 'Cape Dory', 'Cape Fear',
  'Cape George', 'Cape Horn', 'Cape Powercat', 'Cape Scott', 'Capelli', 'Capital',
  'Capoforte', 'Capriole', 'Car Off-shore', 'Carat', 'Caravanboat', 'Caravelle',
  'Carbon Craft', 'Carboyacht', 'Carena', 'Cargo Ship', 'Caribe', 'Caribiana', 'Carkeek',
  'Carlini', 'Carnevali', 'Caroff', 'Carolina', 'Carolina Cat', 'Carolina Classic',
  'Carolina Skiff', 'Carrera Boats', 'Carroll Marine', 'Carter', 'Cartwright', 'Carver',
  'Casa', 'Cascade', 'Cast & Blast', 'Castagnola', 'Castine', 'Castoldi', 'Catalac',
  'Catalina', 'Catalyst', 'Catamaran', 'Catamaran Coaches', 'Catamaran Cruisers', 'Catana',
  'Cataruga', 'Catathai', 'Catch', 'Catfish', 'Cavalier', 'Cavileer', 'Cayman Yachts',
  'Caymas', 'Cayo Boatworks', 'Cayuco Boats', 'CB Boatworks', 'CBI', 'CBS', 'CCYD',
  'CDK Technologies', 'Celebrity', 'Celtic Yachts', 'Center Console', 'Centouno Navi',
  'Centromarine', 'Centurion', 'Century', 'Cerri Cantieri Navali', 'Cervetti', 'Cervigon',
  'CG Boat Works', 'CH Marine', 'Challenger', 'Challenger Boats', 'Chamberlin', 'Champion',
  'Channel Island', 'Chantier de l\'Esterel', 'Chaos', 'Chaparral', 'Charger', 'Charger Boats',
  'Chase', 'Chaser', 'Chassiron', 'Chaudron', 'CHB', 'Checkmate', 'Cheer Men',
  'Cheetah Marine', 'Cheoy Lee', 'Cherokee', 'Cherubini', 'Chesapeake', 'Cheverton',
  'Chittum Skiffs', 'Chris-Craft', 'Chris White', 'Christensen', 'Chrysler', 'Chuck Burns',
  'Chuck Paine', 'Cigala e Bertinetti', 'Cigarette', 'CIM', 'CIMA', 'Circa Marine',
  'CL Yachts', 'Claasen', 'ClackaCraft', 'Clark Sound', 'Class 40', 'Classic',
  'Classic-Yachten', 'Classic Craft', 'Clear', 'Clearwater', 'Clever', 'Clipper',
  'Clipper Motor Yachts', 'CMB Yachts', 'CMN', 'CNB', 'CNC', 'CNM', 'CNSO', 'Coach',
  'Coach Pontoons', 'Coanda', 'Coastal', 'Coastal Craft', 'Coastal Skiff', 'Coaster',
  'Coastworker', 'Cobalt', 'Cobia', 'Cobra', 'Cobra Marine', 'Cobra Ribs', 'Cobra Yachts',
  'Cobrey', 'Cockwells', 'Codecasa', 'Colin Archer', 'Colombo', 'Columbia', 'Columbia Yacht',
  'Columbus Yachts', 'Colvic', 'Colvin', 'Colvin Gazelle', 'Com-Pac', 'Comar', 'Comet',
  'Comfortina', 'Comitti', 'Commander', 'Commercial', 'Compact Mega Yachts', 'Compass',
  'Competition', 'Composite Yacht', 'Compromis', 'Conam', 'Concept', 'Concept Boats',
  'Conch', 'Concord', 'Concordia', 'Condor', 'Conquest', 'Conrad', 'Consolidated',
  'Contender', 'Contessa', 'Contest', 'Continental Trailers', 'Contour', 'Contrast',
  'Cooper', 'Cooper Marine', 'Copino', 'Cora', 'Coral', 'Corbin', 'Corby', 'Cormate',
  'Cormorant', 'Cormorant Yachts', 'Cornish Crabber', 'Cornish Crabbers', 'Coronado',
  'Coronet', 'Correct Craft', 'Corsa', 'Corsair', 'Corsair Marine', 'Corsiva', 'Cortez',
  'Corvette', 'Cosmo Explorer', 'Costa Custom Boats', 'Costantini', 'Cougar', 'Covey Island',
  'CR', 'CraigCat', 'Cranchi', 'Crealock', 'Creative Marine', 'Creekmore', 'Crescent',
  'Crest', 'Crestliner', 'Crevalle', 'Crimat', 'CRN', 'Crocker', 'Crosby', 'Crossbow',
  'Croswait', 'Crown', 'Crownline', 'Crowther', 'Cruise-A-Home', 'Cruisers',
  'Cruisers Sport Series', 'Cruisers Yachts', 'Crusader Boats', 'Crystal Kayak', 'CS', 'CSK',
  'CSY', 'CT', 'Cuda Craft', 'Cuddy Cabin', 'Cure', 'Curtevenne', 'Curvelle', 'Custom',
  'Custom-Craft', 'Custom Carolina', 'Custom Line', 'Custom Weld', 'Cutlass', 'Cutter',
  'Cutwater', 'Cyclone', 'Cygnus', 'Cypress Cay', 'Cytra',
  // ── D ─────────────────────────────────────────────────────────────────────
  'D-Boat', 'Dagless', 'Dahl', 'Dakota', 'Dakota Creek', 'Dale', 'Dalla Pieta', 'Damarin',
  'Damen', 'DanielP1Tester', 'Danish Yachts', 'Dargel', 'Dariel', 'Darling Yachts',
  'Dartsailer', 'Daves Custom Boats', 'Davidson', 'DaVinci', 'Davis', 'Davy & Orsted',
  'Dawson Yachts', 'Daysailer', 'Daytona', 'Dazcat', 'De Antonio Yachts', 'De Beer',
  'De Birs', 'De Cesari', 'De Koning', 'De Ridder', 'De Ruiter', 'De Vries Lentsch',
  'De Waal', 'Dean', 'Deep Impact', 'Deep Water Yachts', 'Deerfoot', 'Defender', 'DeFever',
  'Defiance', 'Degero', 'Dehler', 'Dehong Yachts', 'Del Rey', 'Dell Quay', 'Dellapasqua',
  'Delphia', 'Delta', 'Delta Boatworks', 'Delta Catamarans', 'Delta Marine', 'Delta Powerboats',
  'Deltabay', 'Deltamar', 'Dencho Marine', 'Denison', 'Deo Juvante', 'Derecktor', 'Dereli',
  'Desner', 'Destination Yachts', 'Destiny', 'Devlin', 'Devonport', 'DGS', 'Di Donna',
  'Di Luccia', 'Diano', 'Diaship', 'Dick Zaal', 'Dickerson', 'Diesel Duck', 'Dinghy',
  'Dipol', 'Discovery', 'Ditmar & Donaldson', 'Dixon', 'DMB', 'DNA', 'Dockside', 'Doerak',
  'Doggersbank', 'Dolphin', 'Doma', 'Domar', 'Domina', 'Dominator', 'Don Brooke',
  'Don Smith Power Boats', 'Donzi', 'Doqueve', 'Dorado', 'Doral', 'Dorrien Yachts',
  'Double Eagle', 'Doug Wright', 'Dovercraft', 'Downeast', 'Dracan', 'Draco', 'Drago',
  'Dragon', 'Dragonfly', 'Dragonfly Boatworks', 'Dragos', 'Drait', 'Drake', 'Drakkar',
  'Drascombe', 'Dreamline', 'Dromeas', 'Duarry', 'Dubbel & Jesse', 'Dubhe', 'Duck Water Boats',
  'Duckworth', 'Dudley Dix', 'Duffy', 'Dufour', 'Dufour Catamarans', 'Dullia', 'Dunya Yachts',
  'Duracraft', 'Duranautic', 'Durbeck', 'Duromar', 'Dusky', 'Dutch', 'Dutch American',
  'Dutch Barge', 'Dutch Runabout', 'DutchCraft', 'Dyer', 'Dykstra', 'Dyna', 'Dynamic',
  'Dynamiq', 'Dynamique', 'Dynasty', 'Dörries Yachts',
  // ── E ─────────────────────────────────────────────────────────────────────
  'E-Ticket', 'e Sailing Yachts', 'EagleCraft', 'East Cape', 'East Coast Houseboats',
  'East Marine', 'Eastbay', 'Eastern', 'Eastport', 'Ebbtide', 'Ebyca', 'ECLIPSE', 'Ecoline',
  'Ed Joy', 'Edership', 'Edey & Duff', 'Edge Duck Boats', 'Edgewater', 'Edson', 'Eduardono',
  'Egemar', 'Egeyat', 'Egg Harbor', 'Egret', 'Eider Marine', 'EJET', 'El Pescador', 'Elamd',
  'Elan', 'Elan Boats', 'Elan Power', 'ElbTrawler', 'Elco', 'ElectraCraft', 'Elegance',
  'Elegance Yachts', 'Eleva', 'Eliminator', 'Elite', 'Elite Craft', 'Elling', 'Elliott',
  'Ellis', 'Elvstrom', 'Elysian', 'Enavigo', 'Encore Boat Works', 'Endeavour', 'Endurance',
  'English Harbour', 'Enkhuizensloep', 'Enksail', 'Enterprise Marine', 'ENVI', 'Envision',
  'Eolo', 'Epic', 'Ercoa', 'Ericson', 'Erman', 'Erne Boats', 'ERYD', 'ES Custom', 'Escape',
  'Espadon', 'Essence', 'Essex Boats', 'Etap', 'Etoile Marine', 'Euphoria', 'Eurobanker',
  'Eurocraft', 'Europa', 'Euroship', 'Eurosloep', 'Eurotrawler', 'Evadne', 'Evans',
  'Evans & Sons', 'Evelyn', 'Evene', 'Evens', 'Everglades', 'Evinrude', 'Evo Marine',
  'Evo Yachts', 'Evok Marine', 'Evolution', 'Evolve', 'Evotti', 'Excel', 'Excellent',
  'Excess', 'Excitecat', 'Expedition', 'Explorer', 'Explorer Motor Yachts', 'Express',
  'Express Yachting', 'Expression', 'Extra Yachts', 'Extreme Boats', 'Exuma', 'Eyecat',
  // ── F ─────────────────────────────────────────────────────────────────────
  'F&S', 'Fabbro', 'Factoria Naval de Marin', 'Faeton', 'Fairey', 'Fairlie', 'Fairline',
  'Fairliner', 'Fairways Marine', 'Fairweather Mariner', 'Falcon', 'Falcon Boats',
  'Falcon Yachts', 'Fales', 'Falmouth', 'Famous Craft', 'Fanale Marine', 'Fantasi',
  'Fantasy', 'Farallon', 'FarEast', 'Faro Yachts', 'Faroe', 'Farr', 'Farrell', 'Farrier',
  'Fashion', 'Fast Passage', 'Fat Cat', 'Faurby', 'FB Design', 'Feadship', 'Feelfree',
  'Feeling', 'Felci', 'Felco', 'Fellows & Stewart', 'Fellowship', 'Feltz', 'Ferretti',
  'Ferretti Yachts', 'Ferry', 'FF', 'Fiart', 'Fiat', 'Fibercraft', 'Fiberform', 'Fibrafort',
  'Fibramar', 'Fibresport', 'Fiesta', 'Fifth Ocean Yachts', 'Filippetti', 'FIM',
  'Fincantieri', 'FinCat', 'Fincraft', 'Fineliner', 'Finngulf', 'Finnmaster', 'Finnyacht',
  'Finot', 'Finseeker', 'Finval', 'Firebird', 'First Light', 'Fish Hawk', 'Fish Rite',
  'Fisher', 'Fishing Raptor', 'Fishmaster', 'Fiskars', 'Fisksätra', 'Fitz', 'Fitzroy yachts',
  'Fjord', 'Flagship', 'Flamingo', 'Flash Cat', 'Flats Cat', 'Fleming', 'Fletcher', 'Flevo',
  'Flexboat', 'Flipper', 'Floeth Yachts', 'Florida Bay Coasters', 'Flowers', 'Fluid Watercraft',
  'Flyer', 'Flying Scot', 'Flying Tiger', 'Flynt', 'Focus', 'Foldable RIB', 'Folkboat',
  'Folkes', 'Forbes Cooper', 'Forbina', 'Force', 'Forest River', 'Forester', 'Formosa',
  'Formula', 'Forte', 'Fortier', 'Fortuna', 'Fountain', 'Fountaine Pajot', 'Four Winns',
  'Fox Island', 'Frances', 'Franchini', 'Franck Roy', 'Frans Maas', 'Fraser', 'Fratelli Aprea',
  'Fratelli Mileo', 'Frauscher', 'Fred Shepherd', 'Freedom', 'Freedom Boats', 'Freeman',
  'French Yachts', 'Frers', 'Freya', 'Friendship', 'Front Runner', 'Frontier', 'FS',
  'Fu Hwa', 'Fugu', 'Fuji', 'Fulcrum Speedworks', 'Fun Country', 'Fun Yak', 'Funcraft',
  'Funtime', 'Furia', 'Fusion', 'Futuro Boats',
  // ── G ─────────────────────────────────────────────────────────────────────
  'G&S', 'G-Force', 'G-Tender', 'G3', 'Gagliotta', 'Gala', 'Galaxie', 'Galaxy', 'Galeon',
  'Galia', 'Gallart', 'Gambler', 'Gamefisherman', 'Ganley', 'Ganz Boats', 'Garcia', 'Garin',
  'Garlington', 'Garnet Offshore', 'Gator-tail', 'Gator Trax', 'Gaudet', 'Gause Built',
  'Gekko', 'Gemini', 'Gemini Inflatables', 'General Boats', 'Genesis', 'Genesis Boats',
  'Genesis Yachts', 'Geniuss', 'Gheen', 'Gheenoe', 'GHI Yachts', 'Ghibli', 'Gianetti',
  'Gib\'Sea', 'Gibson', 'Gilles Vaton', 'Gillissen', 'Giorgi', 'Girbau', 'Giupex', 'Glacier',
  'Glacier Bay', 'Glasply', 'Glasstream', 'Glastron', 'Glastron/Carlson', 'Glisenti',
  'Global Boatworks', 'Gloucester', 'Go-Devil', 'Gobbi', 'Godfrey', 'Godfrey Marine', 'Goetz',
  'Gold Coast', 'Golden Star', 'Golden Yachts', 'Goldenship', 'Goldfish', 'Goman', 'Gorbon',
  'Gospel Boat', 'Goudy & Stevens', 'Goymar', 'Gozzard', 'Gozzo', 'Grady-White', 'Grampian',
  'Granada', 'Grand', 'Grand Alaskan', 'Grand Banks', 'Grand Craft', 'Grand Harbour',
  'Grand Inflatables', 'Grand Mariner', 'Grand Ocean', 'Grand Soleil', 'Grandezza', 'Grandy',
  'Granfort', 'Granocean', 'Graunner', 'Gravois', 'Great Harbour', 'Grebe', 'Green Marine',
  'Greene Marine', 'Greenline', 'Grenfell', 'Grew', 'Grey Barn Boatworks', 'Grouwster Vlet',
  'Grover', 'Grumman', 'Gruno', 'GS', 'GSX', 'Gulet', 'Gulf', 'Gulf Coast', 'Gulf Commander',
  'Gulf Craft', 'Gulf Crosser', 'Gulf Stream Yachts', 'Gulfstar', 'Gulliver', 'Gunboat',
  'Gunfleet', 'Guy Bonnet', 'Guy Couach', 'Guymarine',
  // ── H ─────────────────────────────────────────────────────────────────────
  'H&H Marine', 'H2O', 'Haber', 'Hacker-Craft', 'Haines', 'Haiquan', 'Hake / Seaward',
  'Hakvoort', 'Hallberg-Rassy', 'Hallett', 'Halmatic', 'Halter', 'Halvorsen',
  'Hammer Yachts', 'Hampton', 'Hank Hinckley', 'Hanko', 'Hann', 'Hanover', 'Hans Christian',
  'Hanse', 'Hanseat', 'Hanson', 'Harbor Cottage', 'Harbor Master', 'Hardin', 'Harding',
  'Hardy', 'Hargrave', 'Harley', 'Harley Raceboats', 'Harmony', 'Harris', 'Harris-Kayot',
  'Harris Cuttyhunk', 'Harris FloteBote', 'Harrison Boatworks', 'Hartman-Palmer',
  'Hartman Yachts', 'HasCraft', 'Hatteras', 'Havenlodge', 'Havoc', 'Hayaari Marine',
  'Haynie', 'Hbi', 'HCB', 'Heaven', 'Heesen', 'Hell\'s Bay', 'Hell\'s Bay Boatworks',
  'Hellingskip', 'HellKats', 'Helmsman', 'Helmsman Trawlers', 'Hemmes', 'Henriques',
  'Henry O', 'Herbert Woods', 'Heritage East', 'Herley', 'Herreshoff', 'Hershine', 'Hewes',
  'Hewescraft', 'Heyday', 'Heyman', 'Heysea', 'HH Catamarans', 'Hi-Star', 'Hi-tech',
  'Higgins', 'High Tech Yachts', 'Highfield', 'Hilburn', 'Hillyard', 'Hinckley',
  'Hines-Farley', 'Hinterhoeller', 'Hiptimco', 'Historic', 'HM Powerboats', 'Hobie',
  'Hobie Cat', 'HOC', 'Hodgdon', 'Hoek', 'Hog Island Boat Works', 'Holby', 'Holiday',
  'Holiday Mansion', 'Holland', 'Holland Jachtbouw', 'Hollandia', 'Holman', 'Holman & Pye',
  'Holterman', 'Honda', 'Honwave', 'Hoog', 'Hooveld', 'HopYacht', 'Horizon', 'Hotwood\'s',
  'Hourston Glascraft', 'Houseboat', 'Howard', 'HQ Engineering', 'Huckins', 'Hudson',
  'Hugh Saint', 'Hughes', 'Huisman', 'Humber', 'Humphreys', 'Hunt Yachts', 'Hunter',
  'Hunton', 'Hurricane', 'Hurricane Kayaks', 'Hustler', 'Hutting', 'Huzur Yachts', 'Hyatt',
  'Hydra-Sports', 'Hydrocat', 'Hydrolift', 'Hydrostream', 'Hylan', 'Hylas', 'Hysucat',
  'Hyundai',
  // ── I ─────────────────────────────────────────────────────────────────────
  'IAG', 'Ibiza', 'Ice Yachts', 'Icon', 'IDB Marine', 'Idea', 'Iguana', 'iKon', 'ILIAD',
  'Ilver', 'Imago', 'IMP', 'Impulse', 'Inace', 'Indigo', 'Infanta', 'Infiniti', 'Infinity',
  'Inflatable', 'Ingenity', 'Inmar', 'Innovation', 'Innovazione e Progetti', 'Insetta',
  'Integrity', 'INTER', 'Interboat', 'Intercruiser', 'Intermare', 'Intermarine',
  'International', 'Intrepid', 'Intruder', 'Invader', 'Invictus', 'Invincible', 'IOR',
  'Iron', 'Irwin', 'ISA', 'Islamorada Boatworks', 'Island Gypsy', 'Island Hopper',
  'Island Packet', 'Island Pilot', 'Island Plastics', 'Island RIBs', 'Island Runner',
  'Island Spirit', 'Island Trader', 'Islander', 'Isloep', 'Itacatamarans', 'Italboats',
  'Italcraft', 'Italia Yachts', 'Italiamarine', 'Italian Vessels', 'Italmar', 'Italversil',
  'Italyachts', 'Italyure', 'Itama',
  // ── J ─────────────────────────────────────────────────────────────────────
  'J-Composites', 'J Boats', 'J Craft', 'Jacabo', 'Jachtwerf Heeg', 'Jade', 'Jaguar',
  'Jaktar', 'Jamestowner', 'Jan Van Gent', 'Janmor', 'Jarrett Bay', 'Jarvis Newman',
  'Jasper Marine', 'Javelin', 'JC', 'Jeanneau', 'Jeantot', 'Jefferson', 'Jensen', 'Jersey',
  'Jersey Cape', 'Jespersen', 'Jet Tender', 'Jetten', 'JFA Yachts', 'JG Boats', 'Jianglong',
  'Jim Smith', 'Joda', 'Joemarin', 'John Williams', 'Johnson', 'Joker', 'Joker Boat', 'Jomo',
  'Jon Boat', 'Jones-Goodell', 'Jones Brothers', 'Jongert', 'Jonmeri', 'Joubert',
  'Joubert-Nivelt', 'Jouet', 'Joyce', 'JPK', 'Judel and Vrolijk', 'Judge', 'Jupiter',
  'Jutson',
  // ── K ─────────────────────────────────────────────────────────────────────
  'Kaagkruiser', 'Kadey-Krogen', 'Kaiserwerft', 'Kajuitsloep', 'Kalik', 'Kanter', 'Karel',
  'Karnic', 'Kaufman', 'Kavalk', 'Kawasaki', 'Kayflo', 'Keizer', 'Kelly', 'Kelly Peterson',
  'Kelsall', 'Kelt', 'Kempers', 'KenCraft', 'Kennedy', 'Kenner', 'Kent', 'Ker', 'Ketch',
  'Kettenburg', 'Kevlacat', 'Key Largo', 'Key West', 'Kha Shing', 'Kiel Classic',
  'King Marine', 'KingFisher', 'Kingship', 'Kinnamon', 'Kirie', 'Klamath', 'Klase A',
  'Knierim', 'Knight & Carver', 'Knight Tenders', 'Knort', 'Knowles', 'Knysna', 'Kok',
  'Kolibri', 'Kompier', 'Kong & Halvorsen', 'Koopmans', 'Kotter', 'Kraken', 'Kral',
  'KRC Yachting', 'Krogen', 'Krogen Express', 'Kruger', 'Kruiser', 'Kryptonite', 'Kufner',
  'Kuipers Woudsend', 'Kumbra', 'Kusch Yachts', 'Kush', 'Kuster',
  // ── L ─────────────────────────────────────────────────────────────────────
  'L&H', 'L\'acqua Royale', 'La Mare', 'Ladenstein', 'Lafitte', 'Lago Amore', 'Lagoon',
  'Lagos', 'Lake & Bay', 'Lake Lounger', 'Lakesport', 'Lakeview', 'Lancer', 'Lancer Yachts',
  'Lancia Aprea', 'Landamores', 'Landau', 'Landing Craft', 'Langenberg', 'Langweerder Sloep',
  'Lapworth', 'Larson', 'Larson Escape', 'Lasai', 'Laser', 'Latitude 46',
  'Latitude Tournament Boats', 'Latitude Yachts', 'Laurent Giles', 'Laurent Marine',
  'Lavagna', 'Laver', 'Lavranos', 'Lawley', 'Lazer', 'Lazy Days', 'Lazzara', 'LCB',
  'Le Boat', 'Leader', 'Leapher', 'LeComte', 'LEEN', 'Leeuwin', 'Legacy', 'Legacy Boat',
  'Legacy Yachts', 'Legend', 'Legend Boats', 'Legnos', 'Leguen Hemidy', 'Leight Notika',
  'Leisure', 'Leisurecraft', 'Lekker', 'Lema', 'Lemsteraak', 'Leonard', 'Leonardo Yachts',
  'Leopard', 'Level', 'Levi', 'Lexington', 'Lexsia', 'Lianya', 'Liberator', 'Liberty',
  'Lidgard', 'Lien Hwa', 'Life Proof', 'Life Tyme', 'Lifestyle', 'Lifetimer', 'Lift',
  'Lightning', 'Lightning Boatworks', 'Lightning Kayaks', 'Lightwave', 'Lilybaeum', 'Liman',
  'Limestone', 'Limited Edition', 'Limitless', 'Limitless Seas', 'Lindell', 'Linden',
  'Linder', 'Lindsey', 'Linetti', 'Linskens', 'Linssen', 'Lion', 'Liquid Metal Marine',
  'Liquidlogic', 'Little Harbor', 'Litton', 'Liverpool Boats', 'Livingston', 'Llaut',
  'Lloyds Ships', 'LM', 'LNM', 'Lochin', 'Locwind', 'Lomac', 'Long Island', 'Longreach',
  'Lookout', 'Looping', 'Lord Nelson', 'Lotus', 'Lowe', 'Lowell', 'Lowland', 'Lubeck',
  'Luders', 'Luffe', 'Luhrs', 'Luna', 'Lund', 'Lurssen', 'Luxe-Motor', 'Lydia', 'Lyman',
  'Lyman-Morse', 'Lynx', 'Lynxmar',
  // ── M ─────────────────────────────────────────────────────────────────────
  'M.A.T.', 'M Boats', 'Mabry', 'MAC', 'MacGregor', 'Mach 1', 'Macintosh', 'Macwester',
  'Maestro', 'Mag Bay', 'Magazzu', 'Magic Yachts', 'Magna Marine', 'Magnum', 'Magonis',
  'Maine Cat', 'Mainship', 'Maiora', 'Majek', 'Majestic', 'Majesty', 'Majoni', 'Makai',
  'Makaira', 'Makma', 'Mako', 'Malbec', 'Malcolm Tennant', 'Malibu', 'Malo', 'Mamba',
  'Manatee', 'MandaYachts', 'Mangusta', 'Manitou', 'Mano', 'Mano Marine', 'Manta', 'Mao Ta',
  'Maori', 'Maple Leaf', 'MAR.CO', 'Mar sea', 'Marathon', 'Marc Lombard', 'Marcelo Penna',
  'Marchi', 'Marco', 'Marcon', 'Mardaya', 'Maree Haute', 'Marell', 'Mares', 'Marex',
  'Mariah', 'Marian', 'Marieholm', 'Maril', 'Marina Boats', 'Marine', 'Marine Composites',
  'Marine Management', 'Marine Projects', 'Marine Time', 'Marine Trader', 'Marine Trading',
  'Marine Yachting', 'Marinello', 'Mariner', 'Marinette', 'Marino', 'Marion', 'Maritime',
  'Maritime Skiff', 'Maritimo', 'Marker One', 'Markley', 'Markline', 'Marlago', 'Marlin',
  'Marlin Ribs', 'Marlin Yachts', 'Marlon', 'Marlow', 'Marlow-Hunter', 'Marlow Pilot',
  'Marquis', 'Marsaudon Composites', 'Marshall', 'Marstrom', 'Marten', 'Marti Yachts',
  'Martin', 'Martzcraft', 'Marvel', 'Mas', 'Mascot', 'Mason', 'Massimo Marine',
  'Mast & Mallet', 'Master', 'MasterCraft', 'Matez', 'Matrix Yachts', 'Matthews', 'Maverick',
  'Maverick Yachts Costa Rica', 'Max Carter', 'Maxi', 'Maxi Dolphin', 'Maxim Yachts',
  'Maxima', 'Maxum', 'Maxus', 'Maxweld', 'May-Craft', 'Mayland', 'Mays Craft', 'Mazarin',
  'Mazu Yachts', 'MB', 'Mb Sports', 'McConaghy', 'McGruer', 'McKee Craft', 'McKinna',
  'McMullen & Wing', 'MCP', 'McQueen', 'Med Marine', 'Medeiros', 'Mediterranean', 'Medvolt',
  'MedYacht', 'Meersloep', 'Megaway', 'Melges', 'Menger', 'Mengi Yay', 'Menken',
  'Menorquin', 'Mercan', 'Mercator Boat Works', 'Mercury', 'Mercury Inflatables', 'Meridian',
  'Merritt', 'Mestral Marine Works', 'Meta', 'MetalCraft', 'MG', 'Mi Tide', 'Midget',
  'Midnight Express', 'Midnight Lace', 'Midship Marine', 'Mig', 'Mikelson', 'Miller Marine',
  'Mills', 'Mimi', 'Mingolla', 'Mira', 'Mirage', 'Mirage Manufacturing', 'Mirage Yachts',
  'Mirakul', 'MirroCraft', 'Miss Cat', 'Miss Tor Yacht', 'Misty Harbor', 'Mitchell',
  'Mitzi Skiffs', 'MJM', 'MJM Yachts', 'MMGI', 'Moa', 'Mochi Craft', 'Molenkruiser',
  'Monachus', 'Monark', 'Monaro', 'Mondomarine', 'Monk', 'Montara', 'Monte Carlo Yachts',
  'Monte Fino', 'Montego Bay', 'Monterey', 'Monticello', 'Moody', 'Moomba', 'Moon',
  'Moonday', 'Moonen', 'More', 'Morgan', 'Morris', 'Mostes', 'Motion Marine', 'Motor Yacht',
  'Motorsailer', 'MTI', 'Mulder', 'Multiplast', 'Munson', 'Mural Yachts', 'Mussel Ridge',
  'Mussini', 'Mustang', 'MV Marine', 'MVI', 'Myabca', 'Myacht', 'Mylius', 'Mystery',
  'Mystic', 'Mystic Powerboats', 'Mystica',
  // ── N ─────────────────────────────────────────────────────────────────────
  "N'Fun", 'Nacra', 'Najad', 'Nakhoda', 'Nanni', 'Narrowboat', 'Narwhal', 'Nassima Yacht',
  'Native Watercraft', 'Naumatec', 'Nauset', 'Nauta Yachts', 'Nautic', 'Nautic Saintonge',
  'Nautica', 'Nautica Cab', 'Nauticat', 'Nauticks', 'NauticStar', 'Nautique', 'Nautitech',
  'Nautor Swan', 'Naval Force 3', 'Naval Yachts', 'Navalia', 'Navan', 'Navigator', 'Navisoul',
  'Navisyo Homes', 'NEEL', 'Nelson', 'Nelson Marek', 'Neo', 'Nepallo', 'Neptun', 'Neptune',
  'Neptunus', 'Nerea Yacht', 'New Ocean Yachts', 'New Zealand Yachts', 'Newport', 'Newton',
  'NewWater', 'Niagara', 'Nicholson', 'Nidelv', 'Nigel Irens', 'Nikhen', 'Nimbus', 'Nireus',
  'Nissen', 'Nitra Boats', 'Nitro', 'Nolimits', 'Nomad', 'Nonsuch', 'Noordkaper', 'Nor-Tech',
  'Nord Star', 'Nord West', 'Nordhavn', 'Nordia', 'Nordic', 'Nordic Boats',
  'Nordic Powerboats', 'Nordic Tug', 'Nordkapp', 'Nordlund', 'Nordship', 'Norman Wright',
  'Norseman', 'Norstar', 'North-Line', 'North Atlantic Inflatables', 'North Pacific',
  'North River', 'North Wind', 'NorthCoast', 'Northcoast Yachts', 'Northern Bay',
  'Northern Marine', 'Northman', 'Northmaster', 'Northshore', 'Northstar', 'Northwest',
  'Northwood', 'Nova', 'Novamarine', 'Novatec', 'Novielli', 'Novurania', 'Numarine',
  'Nuova Jolly', 'Nuva', 'NX Boats',
  // ── O ─────────────────────────────────────────────────────────────────────
  "O'Day", 'Ocea', 'Ocean', 'Ocean 1', 'Ocean Alexander', 'Ocean Craft Marine',
  'Ocean Explorer Catamarans', 'Ocean Kayak', 'Ocean King', 'Ocean Master', 'Ocean Renegade',
  'Ocean Runner', 'Ocean Sport', 'Ocean Voyager', 'Ocean Yachts', 'Oceanco', 'Oceanfast',
  'Oceania', 'Oceanic', 'Oceanmaster', 'OceanPro', 'Oceanwalker', 'Ochsner', 'Ockelbo',
  'Ocqueteau', 'Odyssey', 'Odyssey Pontoons', 'Offshore Racing', 'Offshore Yachts', 'Ohlson',
  'OKEAN', 'Olbap', 'Old Town', 'Oldport', 'Olivier Van Meer', 'Olympic', 'Omaya',
  'Omikron Yachts', 'Onda', 'One Design', 'ONJ', 'Onslow Bay', 'Ontario Yachts',
  'Oostvaarder', 'Orion', 'Orkney', 'Oromarine', 'Ortona Navi', 'Oryx', 'Osborne', 'Osprey',
  'Otam', 'other', 'Oud Huijzer', 'Out Island', 'Outback Yachts', 'Outbound',
  'Outer Reef Yachts', 'Outerlimits', 'Outremer', 'Ovation', 'Overseas', 'Ovni', 'Owens',
  'Oyster',
  // ── P ─────────────────────────────────────────────────────────────────────
  'Pace', 'Pacemaker', 'Pacific', 'Pacific Allure', 'Pacific Craft', 'Pacific Mariner',
  'Pacific Prestige', 'Pacific Seacraft', 'Pacifica', 'Paddle King', 'Pair Customs',
  'Palm Beach', 'Palm Beach Motor Yachts', 'Palmer Johnson', 'Palmer Marine', 'Palmetto',
  'Panga', 'Pantera', 'Paradigm', 'Paragon', 'Pardo Yachts', 'Paritetboat', 'Parker',
  'Parker Poland', 'Parker Yachts (UK)', 'Parti Kraft', 'Pascoe', 'Passport', 'Pathfinder',
  'Patriot', 'Paul Mann', 'Pavati', 'PDQ', 'Pearl', 'Pearson', 'Pedro', 'Pegasus', 'Pegazus',
  'Pelin', 'Pendennis', 'Penguin', 'Penn Yan', 'Perception Kayaks', 'Performance',
  'Peri Yachts', 'Perini Navi', 'PerMare', 'Perry', 'Pershing', 'Persico', 'Peterson',
  'Phantom', 'Phenom', 'Phinisi', 'Phoenix', 'Piantoni', 'Picchiotti', 'Pichavant',
  'Pieter Beeldsnijder', 'Pieterman', 'Pieterse', 'Pikmeerkruiser', 'Pilot', 'Pilothouse',
  'Pioneer', 'Pioner', 'Piper', 'Piranha', 'Pirelli', 'Pischel Ribline', 'Platinum',
  'Playbuoy', 'PlayCraft', 'Pluckebaum', 'Pogo', 'Pointer', 'Polar', 'Polar Kraft',
  'Polaris', 'Pollard', 'Ponderosa', 'Pontoon', 'Porsche', 'Porsius', 'Portofino',
  'Poseidon', 'Posillipo', 'Post', 'Pouvreau', 'Powerplay Powerboats', 'Powerquest',
  'Powles', 'Precision', 'Predator', 'Premier', 'Present Yachts', 'President', 'Prestige',
  'Prima', 'Primatist', 'Primeur', 'Princecraft', 'Princess', 'Prins', 'Prinz Yachts',
  'Privateer', 'Privilege', 'Pro-Drive', 'Pro-Line', 'Pro-steelheader', 'Pro Boat Yachts',
  'Pro Sports', 'ProCraft', 'Prodigy', 'Proficiat', 'Profile', 'ProKat', 'Protagon',
  'Protector', 'Protender', 'Proton', 'Prout', 'Prowler', 'Prua Al Vento', 'PT', 'PTS',
  'Puffin', 'Puma', 'Punch', 'Pursuit', 'PY Yacht', 'Python', 'Pyxis Yachts', "Päijän",
  // ── Q ─────────────────────────────────────────────────────────────────────
  'Qualia', 'Quarken', 'Queens Yachts', 'Queenship', 'Quer', 'Quest', 'Quicksilver', 'Qwest',
  // ── R ─────────────────────────────────────────────────────────────────────
  'R-Sport Powerboats', 'Radon', 'Raffaelli', 'Rafnar', 'Raider', 'Rambo', 'Rampage',
  'Rampart', 'Rand', 'Ranger', 'Ranger Tugs', 'Ranger Yachts', 'Ranieri', 'Rapido',
  'Rapsody', 'Rare', 'Rayglass', 'Razor Cat', 'Real', 'Reale', 'Reaper Boats', 'Rebel',
  'Reborn', 'Recon', 'Redbay Boats', 'Reddingssloep', 'Reef Runner', 'Reflex', 'Regal',
  'Regency', 'Regency Yachts', 'Regina', 'Regulator', 'Reichel/Pugh', 'Reinell', 'Reinke',
  'Release', 'Release Boatworks', 'Reliance', 'Reline', 'Renegade', 'Renier', 'Renken',
  'Revel', 'Revenger', 'Revolt', 'Rh Boats', 'Rhea', 'Rhino', 'Rhodes', 'RIB', 'Rib-X',
  'Ribco', 'Ribcraft', 'Ribeye', 'Ribjet', 'Ribquest', 'Ribtec', 'Richmond Yachts', 'Ridas',
  'Rigid Boats', 'Rigiflex', 'Rinker', 'RIO', 'Rio Yachts', 'Riva', 'Rival', 'River',
  'River Boats', 'River Hawk', 'Riviera', 'Riviera Cruiser', 'Rivolta', 'Rizzardi',
  'RM Yachts', 'RMK Marine', 'RO', 'Robalo', 'Robert Clark', 'Robert Perry', 'Roberts',
  'Robertson', 'Robust', 'Rock Marine', 'Rockharbour', 'Rodman', 'Rodriquez', 'Roger Hill',
  'Rogger', 'Ronautica', 'Rosborough', 'Rose Island', 'Rosewest', 'Rossinavi', 'Rossiter',
  'Rough Water', 'Roughneck', 'Roughwater', 'Royal', 'Royal Cape Catamarans', 'Royal Denship',
  'Royal Huisman', 'RS', 'Ruby', 'Runabout', 'Rupert', 'Rustler', 'Rybovich', 'RYCK', 'Ryds',
  // ── S ─────────────────────────────────────────────────────────────────────
  'S2', 'Sabor', 'Sabre', 'SACS', 'Sadler', 'Saffier', 'Saga', 'Sailboat', 'Sailfish',
  'Salcombe', 'Salona', 'Salpa', 'Salt Shaker', 'Salthouse', 'Saltram', 'Salut', 'Samson',
  'San Juan', 'San Pan', 'San Remo', 'Sanger', 'Sangermani', 'Sanlorenzo', 'Sanpan',
  'Sanremo', 'Santa Cruz', 'Santamargherita', 'Santasevera', 'Santee', 'Sargo', 'Sarnico',
  'Sasga Yachts', 'Saturna', 'Savannah', 'Saver', 'Saxdor', 'SAY', 'Scan Marine', 'Scand',
  'Scandi', 'Scanmar', 'Scanner', 'Scar', 'Scarab', 'Scarani', 'SCB', 'Sceptre', 'Schaefer',
  'Schionning', 'Schock', 'Schokker', 'Schooner', 'Sciallino', 'Scorpion', 'Scout',
  "Scully's", 'Sea-Doo', 'Sea-Doo Sport Boats', 'Sea-Lion', 'Sea Born', 'Sea Boss',
  'Sea Cat', 'Sea Chaser', 'Sea Eagle', 'Sea Fox', 'Sea Hunt', 'Sea Master', 'Sea Nymph',
  'Sea Pro', 'Sea Prop', 'Sea Ranger', 'Sea Ray', 'Sea Ribs', 'Sea Skimmer', 'Sea Sport',
  'Sea Sprite', 'Sea Water', 'SeaArk', 'Seabird', 'SeaCraft', 'Seafaring', 'Seafury',
  'Seagame', 'Seahawk', 'Seahorse', 'SeaHunter', 'Sealegs', 'Sealine', 'Sealver',
  'Seamaster', 'Seanfinity', 'SeaPiper', 'Seapro', 'Seaquest', 'Seascape', 'SeaSport',
  'SeaStorm', 'Seaswirl', 'Seaswirl Striper', 'Seaton', 'SeaVee', 'Seaward', 'Seaway',
  'Seaweed', 'SeaWell', 'Seawind', 'Sedna', 'Sedona', 'Segue', 'Selection Boats', 'Selene',
  'Selva', 'Sensation Yachts', 'Serenity', 'SERO Innovation', 'Ses Yachts', 'Sessa Marine',
  'Seven Seas Yachts', 'Shakespeare', 'Shallow Sport', 'Shallow Stalker', 'Shamrock',
  'Shannon', 'Shark', 'SharkCaretta', 'Sharpe', 'Shearline', 'ShearWater', 'Sheerline',
  'Shepherd', 'Shetland', 'Shipman', 'Shoalwater', 'Shogun', 'Shuttleworth', 'Sichterman',
  'Sigma', 'Silent', 'Sillinger', 'Siltala', 'Silver', 'Silver Ships', 'Silver Streak',
  'Silver Wave', 'Silver Yachts', 'SilverCAT', 'Silvercraft', 'Silverhawk', 'Silverline',
  'Silverton', 'Siman Yachts', 'Simbad', 'Simonis Voogd', 'Simpson', 'Sirena', 'SISU',
  'SK', 'Skagit Orca', 'Skamander', 'Skater', 'Skeeter', 'Ski Centurion', 'Skiff Craft',
  'Skilso', 'Skimmer', 'Skipjack', 'Skipper', 'Skipper-BSK', 'Skipperliner', 'Skookum',
  'Skorgenes', 'Skuta', 'Skutsje', 'Sleepboot', 'Slickcraft', 'Slocum', 'Sloep', 'Sloop',
  'Slyder', 'Smart Cat', 'Smartliner', 'Smelne', 'Smoker Craft', 'Smoky Mountain', 'Sogica',
  'Solace', 'Solara', 'Solare', 'Solaris', 'Solaris Power', 'Sole Power Boats', 'Solemar',
  'Sollux', 'Sonic', 'South Bay', 'South Shore', 'Southerly', 'Southern Cross',
  'Southern Marine', 'Southern Ocean', 'Southern Wind', 'Southport', 'SouthWind', 'Sovereign',
  'Soyaslan', 'Sparkman & Stephens', 'Spartan', 'Spectre', 'Spectrum', 'Spencer',
  'Spencer Yachts', 'Spindrift', 'Spirit', 'Spirit Yachts', 'Splendor', 'Sport-Craft',
  'Sportsman', 'Sprint', 'SPX RIB', 'Spyder', 'Squalt Marine', 'St. Francis', 'ST Boats',
  'Stabicraft', 'Stabile', 'Stamas', 'Stancraft', 'Standfast', 'Stanley', 'Starcraft',
  'Stardust Cruisers', 'Starfisher', 'Starlite', 'Starweld', 'Statement', 'Statement Marine',
  'Stealth', 'StealthCraft', 'Steelcraft', 'Steeler', 'Stefini', 'Steiger Craft', 'Stentor',
  'Stephens', 'STERK', 'Sterling', 'Sterling Yachts', 'Stevens', 'Stinger', 'Stingher',
  'Stingray', 'Stolper', 'Stoner', 'Storebro', 'Storm', 'Stormer', 'Stratos', 'Streamline',
  'Streblow', 'Strike', 'Striker', 'Striper', 'Stryker', 'Stuart', 'Stuart Angler',
  'Stuart Marine', 'Stumpnocker', 'Sturier', 'Su Marine', 'Submarine', 'Succes', 'Sumerset',
  'Sumerset Houseboats', 'Summit', 'Sun Runner', 'Sun Tracker', 'Sunbeam', 'Sunbird',
  'SunCatcher', 'SunChaser', 'Suncoast', 'Suncruiser', 'Sundance', 'Sundancer Pontoons',
  'Sundancer Poontoons', 'Sundeck Yachts', 'Sundeer', 'Sunny Briggs', 'Sunpower', 'Sunreef',
  'Sunsation', 'Sunseeker', 'Sunset Bay', 'Sunstar', 'Super Lauwersmeer', 'Super Van Craft',
  'Supermarine', 'SuperRib', 'Superyacht', 'Supra', 'Supreme', 'SUR Marine', 'Suzuki',
  'Sweden Yachts', 'Sweetwater', 'Sweetwater Tuscany', 'Swiftships', 'Swiss Cat Yachts',
  'Swordsman', 'Sydney', 'Sylvan', 'Symbol',
  // ── T ─────────────────────────────────────────────────────────────────────
  'T-Yachts', 'Ta Chiao', 'Ta Shing', 'TAG', 'Tahoe', 'Tahoe Pontoon', 'Taiga', 'Takacat',
  'Taling', 'Tankoa', 'Tansu', 'Tanton', 'Targa', 'Target', 'Tarpon', 'Tarquin', 'Tarrab',
  'Tarsis', 'Tartan', 'Taswell', 'Tayana', 'Taylor', 'Teaser', 'Technohull',
  'Technologie Marine', 'Tecnomar', 'Tecnomarine', 'Tecnorib', 'Ted Brewer', 'Tempest',
  'Tender', 'TendR', 'Terhi', 'Terranova Yachts', 'Tes', 'Tesoro', 'Test', 'Texas', 'TG',
  'Thomasz', 'Thompson', 'Thor', 'Thornycroft', 'Thoroughbred', 'Three Buoys', 'Thunder Jet',
  'Thunderbird', 'Thundercraft', 'Tiara', 'Tiara Sport', 'Tiara Yachts', 'Tide Craft',
  'Tideline', 'Tides', 'Tidewater', 'Tiffany', 'Tiger Marine', "Tigé", 'Tillotson-Pearson',
  'Titan', 'Titan Yachts', 'Tjalk', 'Tofinou', 'Tollycraft', 'TomCat', 'Tony Giugliano',
  'Topaz', 'Topcraft', 'TORGEM', 'Tornado', 'Toy', 'Tracker', 'Trader', 'Tradewind',
  'Traditional', 'Trailer', 'Transpacific Marine', 'TransWorld', 'Trapper', 'Trawler',
  'Treffer', 'Trehard', 'TRICAT', 'Trident', 'Trifecta', 'Trimaran', 'Trimarchi',
  'Trinity Yachts', 'Trintella', 'Tripp', 'Triton', 'Triumph', 'Trojan', 'Trophy',
  'Tropida', 'True North', 'True World Marine', 'Trumpy', 'Tuccoli', 'Tuffy', 'Tugboat',
  'Tullio Abbate', 'Tuna', 'Tung Hwa', 'Tureddi', 'Turquoise', 'Twin Anchors', 'Twin Vee',
  'Twisted',
  // ── U ─────────────────────────────────────────────────────────────────────
  'U-Boat Worx', 'UFO', 'Ultra Lite Tenders', 'Ultramar', 'Uniesse', 'Uniflite',
  'Universal Marine', 'Universal Yachting', 'US Coast Guard', 'Utility Series', 'Uttern',
  // ── V ─────────────────────────────────────────────────────────────────────
  'Vacance', 'Vagabond', 'Valhalla Boatworks', 'Valiant', 'Valiatt', 'Valk', 'Valkkruiser',
  'Valkvlet', 'Vallicelli', 'Van Dam', 'Van De Stadt', 'Van den Akker', 'Van den Hoven',
  'Van der Heijden', 'Van der Valk', 'Van Rossum', 'Van Vossen', 'Van Wijk', 'Vancouver',
  'Vanderbilt', 'VanDutch', 'Vanguard', 'Vanquish', 'Vanquish Yachts', 'Vantare', 'Varatti',
  'Vector', 'Vectra', 'Vedette', 'Veer', 'Veha', 'Velmare', 'Velocity', 'Venegy',
  'Vennekens', 'Ventura', 'Venture', 'Veranda', 'Versilcraft', 'Vetus', 'Vexus', 'Veya',
  'Via', 'Viaggio', 'Vic Franck', 'Vicem', 'Victoire', 'Victoria', 'Viggo', 'Vikal',
  'Viking', 'Viking Boats', 'Viking Marin', 'Viking Princess', 'Viking Sport Cruisers',
  'Viknes', 'Viko', 'Vilm', 'Vindex', 'Vindo', 'Vintage', 'VIP', 'Viper', 'Virtue',
  'Vision', 'Vision Marine Technologies', 'VisionF', 'Vismara', 'Vitech', 'Vitters',
  'Vivante', 'Vizianello', 'Vlet', 'Vortex', 'Voyage', 'Voyage Yachts', 'Voyager',
  'Vri-Jon', 'Vripack', 'Vtech', 'VZ',
  // ── W ─────────────────────────────────────────────────────────────────────
  'W.A. Souter & Sons', 'Waarschip', 'Wahoo', 'Wajer', 'Walker Bay', 'Wally', 'War Eagle',
  'Warrior', 'Warwick', 'Wasque', 'Waterdream', 'Waterland', 'Waterline', 'Waterlodge',
  'Waterman', 'Waterspoor', 'Watersports Car', 'Watkins', 'Wato', 'Wauquiez', 'Wave',
  'Weaver', 'Webbers Cove', 'WeCo', 'Weeres', 'WeldBilt', 'Weldcraft', 'Wellcraft',
  'Wellington', 'Wendon', 'Wesmac', 'West Bay', 'Wester Engh', 'Westerly', 'Westport',
  'Westsail', 'Westwind', 'Weta', 'Whaly', 'Whisper', 'Whisstock', 'Whitby', 'Whitcraft',
  'White Brothers', 'White River', 'White Shark', 'Whitewater', 'Whiticar', 'Wider',
  'Wilbur', 'Wildcat', 'Wilderness Systems', 'Willard', 'Willard Marine', 'William Fife',
  'William Garden', 'Williams Jet Tenders', 'Windelo', 'Windy', 'Winner',
  'Winter Custom Yachts', 'Wiszniewski Yachts', 'Wolfeboro', 'Wooldridge', 'Workboat',
  'World Cat', 'Wyliecat',
  // ── X ─────────────────────────────────────────────────────────────────────
  'X-Yachts', 'X Shore', 'Xcursion', 'XO', 'Xplor', 'Xpress', 'Xquisite Yachts',
  'Xtramarine',
  // ── Y ─────────────────────────────────────────────────────────────────────
  'Yachting Developments', 'Yachting France', 'YAM', 'Yamaha Boats', 'Yamaha Outboards',
  'Yamaha WaveRunner', 'Yamarin', 'Yar-Craft', 'Yaretti', 'Yellowfin', 'YOT', 'Young Boats',
  'Young Brothers', 'Young Sun', 'Yuka Yacht', 'YYachts',
  // ── Z ─────────────────────────────────────────────────────────────────────
  'Zar', 'Zar Formenti', 'ZAR Mini', 'Zaramarin', 'Zarro', 'ZCB', 'Zeelander', 'Zeeschouw',
  'Zegers', 'Zeilkotter', 'Zephyr', 'Zeppelin Inflatables', 'Zeta', 'Zeta Elle', 'Zijlmans',
  'Zinder', 'Zodiac', 'Zonda', 'Zuanelli', 'Zuiderzee',
  // ── A (missed entry, sort handles placement) ──────────────────────────────
  'Agena Marin',
].filter((v, i, a) => a.indexOf(v) === i).sort()

const CONFIDENCE_COLOR = { high: 'text-green-600', medium: 'text-yellow-600', low: 'text-red-500' }

// Compact price formatter: $455,000 → $455K, $1,200,000 → $1.2M
function fmtK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${n.toLocaleString()}`
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ValueMyVesselPage() {
  // AI tool state
  const [form, setForm] = useState({
    year: String(CURRENT_YEAR - 3), make: '', model: '', length_ft: '',
    hours: '', condition: 'good', engine_count: '', engine_make: '', engine_model: '',
  })
  const [result, setResult]   = useState<ValuationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [stage, setStage]     = useState<Stage>('input')

  // Make autocomplete state
  const [showMakes, setShowMakes] = useState(false)
  const filteredMakes = BOAT_MAKES.filter(m =>
    m.toLowerCase().includes(form.make.toLowerCase())
  )

  // Model autocomplete state — driven by selected make
  const [showModels, setShowModels] = useState(false)
  const makeModels: string[] = BOAT_MODELS[form.make] ?? []
  const filteredModels = makeModels.filter(m =>
    m.toLowerCase().includes(form.model.toLowerCase())
  )

  // Gate state
  const [gate, setGate]           = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError]   = useState<string | null>(null)
  const gateTurnstileRef = useRef<HTMLDivElement>(null)
  const gateWidgetId     = useRef<string | null>(null)

  // Load Turnstile for the gate form
  useEffect(() => {
    const scriptId = 'cf-turnstile-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true; script.defer = true
      document.head.appendChild(script)
    }
    const render = () => {
      if (gateTurnstileRef.current && (window as any).turnstile && !gateWidgetId.current) {
        gateWidgetId.current = (window as any).turnstile.render(gateTurnstileRef.current, { sitekey: SITE_KEY, theme: 'light' })
      }
    }
    if ((window as any).turnstile) { render() } else {
      const interval = setInterval(() => { if ((window as any).turnstile) { render(); clearInterval(interval) } }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setG = (k: string, v: string) => setGate(g => ({ ...g, [k]: v }))

  // Step 1: run the AI valuation
  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setStage('input')
    try {
      const res = await fetch('/api/valuation/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year:         Number(form.year),
          make:         form.make,
          model:        form.model || undefined,
          length_ft:    Number(form.length_ft),
          hours:        form.hours ? Number(form.hours) : undefined,
          condition:    form.condition,
          engine_count: form.engine_count ? Number(form.engine_count) : undefined,
          engine_make:  form.engine_make || undefined,
          engine_model: form.engine_model || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Valuation failed'); return }
      setResult(data)
      setStage('teaser')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: unlock full results — capture lead and email Austin
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!result) return
    const token = (window as any).turnstile?.getResponse(gateWidgetId.current)
    if (!token) { setGateError('Please complete the security check.'); return }
    setGateLoading(true); setGateError(null)
    try {
      const emailRes = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: gate.firstName,
          lastName:  gate.lastName,
          email:     gate.email,
          phone:     gate.phone,
          year:      form.year,
          make:      form.make,
          model:     form.model,
          length:    form.length_ft,
          hours:     form.hours,
          engines:   [form.engine_count, form.engine_make, form.engine_model].filter(Boolean).join(' '),
          location:  '',
          notes:     `AI Estimate — Conservative $${result.low.toLocaleString()} / Mid $${result.mid.toLocaleString()} / High $${result.high.toLocaleString()}. Confidence: ${result.confidence}. Comps: ${result.comp_count}.`,
        }),
      })
      if (!emailRes.ok) { setGateError('Failed to send — please check your email and try again.'); ;(window as any).turnstile?.reset(gateWidgetId.current); return }
      setStage('unlocked')
    } catch {
      setGateError('Something went wrong. Please try again.')
    } finally {
      setGateLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      {/* Hero */}
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Sell Your Vessel</p>
        <h1 className="text-4xl font-bold mb-3">What Is My Boat Worth?</h1>
        <p className="text-gray-300 text-sm max-w-xl mx-auto leading-relaxed">
          Get an instant AI-powered estimate based on live market data, or request a personalised assessment from our team.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ── LEFT: AI Instant Estimate ─────────────────────────────────── */}
        <div className="bg-white shadow-sm border border-gray-100 p-8">
          <div className="border-l-4 pl-4 mb-8" style={{ borderColor: '#c9a84c' }}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Instant AI Estimate</p>
            <h2 className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>Live Market Valuation</h2>
            <p className="text-sm text-gray-400 mt-1">Based on real comparable listings updated daily</p>
          </div>

          {/* Input form */}
          {stage === 'input' && (
            <form onSubmit={handleEstimate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Year *</label>
                  <select value={form.year} onChange={e => set('year', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Make *</label>
                  <input
                    type="text" value={form.make} required
                    placeholder="e.g. Sportsman, Viking"
                    onChange={e => { set('make', e.target.value); setShowMakes(true) }}
                    onFocus={() => setShowMakes(true)}
                    onBlur={() => setTimeout(() => setShowMakes(false), 150)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                  />
                  {showMakes && filteredMakes.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto mt-1">
                      {filteredMakes.map(m => (
                        <li key={m}
                          onMouseDown={() => { set('make', m); set('model', ''); setShowMakes(false) }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                          style={{ color: '#0c1f3f' }}>
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Model</label>
                  <input
                    type="text"
                    value={form.model}
                    placeholder={makeModels.length > 0 ? `${makeModels.length} models available…` : 'e.g. 352 Open, 48 Convertible'}
                    onChange={e => { set('model', e.target.value); setShowModels(true) }}
                    onFocus={() => setShowModels(true)}
                    onBlur={() => setTimeout(() => setShowModels(false), 150)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded"
                  />
                  {showModels && (filteredModels.length > 0) && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto mt-1">
                      {filteredModels.map(m => (
                        <li key={m}
                          onMouseDown={() => { set('model', m); setShowModels(false) }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                          style={{ color: '#0c1f3f' }}>
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Length (ft) *</label>
                  <input type="number" value={form.length_ft} onChange={e => set('length_ft', e.target.value)}
                    placeholder="e.g. 35" required min="10" max="200"
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Hours</label>
                  <input type="number" value={form.hours} onChange={e => set('hours', e.target.value)}
                    placeholder="e.g. 450" min="0"
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Condition *</label>
                  <select value={form.condition} onChange={e => set('condition', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded">
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engines</label>
                  <select value={form.engine_count} onChange={e => set('engine_count', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-400 rounded">
                    <option value="">Quantity</option>
                    <option value="1">Single</option>
                    <option value="2">Twin</option>
                    <option value="3">Triple</option>
                    <option value="4">Quad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Make</label>
                  <input type="text" value={form.engine_make} onChange={e => set('engine_make', e.target.value)}
                    placeholder="Mercury, Yamaha…"
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Engine Model / Series</label>
                <input type="text" value={form.engine_model} onChange={e => set('engine_model', e.target.value)}
                  placeholder="e.g. Verado 400, F350"
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50 rounded"
                style={{ backgroundColor: '#0c1f3f' }}>
                {loading ? 'Analyzing market data…' : 'Get My Instant Estimate'}
              </button>
            </form>
          )}

          {/* Teaser — price range visible, full breakdown locked */}
          {(stage === 'teaser' || stage === 'unlocked') && result && (
            <div className="space-y-6">
              {/* Always-visible price range */}
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Estimated Market Value</p>
                <div className="grid grid-cols-3 gap-3 text-center mb-2">
                  <div className="border border-gray-100 py-5 px-2 flex flex-col items-center justify-between min-h-[90px]">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Low</p>
                    <p className="text-xl font-bold mt-auto" style={{ color: '#0c1f3f' }}>{fmtK(result.low)}</p>
                  </div>
                  <div className="border-2 py-5 px-2 flex flex-col items-center justify-between min-h-[90px]" style={{ borderColor: '#c9a84c' }}>
                    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#c9a84c' }}>Mid</p>
                    <p className="text-2xl font-bold mt-auto" style={{ color: '#0c1f3f' }}>{fmtK(result.mid)}</p>
                  </div>
                  <div className="border border-gray-100 py-5 px-2 flex flex-col items-center justify-between min-h-[90px]">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">High</p>
                    <p className="text-xl font-bold mt-auto" style={{ color: '#0c1f3f' }}>{fmtK(result.high)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span>Confidence: <span className={`font-semibold capitalize ${CONFIDENCE_COLOR[result.confidence]}`}>{result.confidence}</span></span>
                  <span>{result.comp_count} comparable listings analyzed</span>
                </div>
              </div>

              {/* Gate — lock full breakdown */}
              {stage === 'teaser' && (
                <div className="border border-gray-100 bg-gray-50 rounded p-6">
                  <p className="text-sm font-semibold mb-1" style={{ color: '#0c1f3f' }}>Unlock the Full Breakdown</p>
                  <p className="text-xs text-gray-400 mb-4">See comparable listings, engine package analysis, and detailed methodology. A Breck Yacht Group broker will also follow up to compare notes.</p>
                  <form onSubmit={handleUnlock} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="First Name" required value={gate.firstName}
                        onChange={e => setG('firstName', e.target.value)}
                        className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                      <input type="text" placeholder="Last Name" required value={gate.lastName}
                        onChange={e => setG('lastName', e.target.value)}
                        className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                    </div>
                    <input type="email" placeholder="Email Address" required value={gate.email}
                      onChange={e => setG('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                    <input type="tel" placeholder="Phone (optional)" value={gate.phone}
                      onChange={e => setG('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded" />
                    <div ref={gateTurnstileRef} />
                    {gateError && <p className="text-red-500 text-xs">{gateError}</p>}
                    <button type="submit" disabled={gateLoading}
                      className="w-full py-3 text-sm font-semibold tracking-widest uppercase text-white transition-opacity hover:opacity-80 disabled:opacity-50 rounded"
                      style={{ backgroundColor: '#c9a84c' }}>
                      {gateLoading ? 'Unlocking…' : 'View Full Report'}
                    </button>
                    <p className="text-xs text-gray-400 text-center">No spam. We&apos;ll only reach out about your vessel.</p>
                  </form>
                </div>
              )}

              {/* Full unlocked results */}
              {stage === 'unlocked' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-100 rounded px-4 py-3 text-sm text-green-700">
                    ✓ Report unlocked. Austin will be in touch to compare notes.
                  </div>

                  {/* Comp table */}
                  {result.comps.length > 0 && (
                    <div>
                      <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Top Comparable Listings</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {['Vessel', 'Year', 'Len', 'Hrs', 'Price', 'Location'].map(h => (
                                <th key={h} className="text-left uppercase tracking-widest text-gray-400 pb-2 pr-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.comps.map((c, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-2 pr-3 font-medium" style={{ color: '#0c1f3f' }}>
                                  {c.url
                                    ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">{c.name}</a>
                                    : c.name}
                                </td>
                                <td className="py-2 pr-3 text-gray-500">{c.year}</td>
                                <td className="py-2 pr-3 text-gray-500">{c.length_ft}ft</td>
                                <td className="py-2 pr-3 text-gray-500">{c.hours > 0 ? c.hours.toLocaleString() : '—'}</td>
                                <td className="py-2 pr-3 font-semibold" style={{ color: '#0c1f3f' }}>${c.price.toLocaleString()}</td>
                                <td className="py-2 text-gray-500">{c.location}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 italic">{result.methodology}</p>
                  <p className="text-xs text-gray-400 italic">9% list-to-sale discount applied — comps reflect asking prices, not closed transactions.</p>

                  <button onClick={() => { setStage('input'); setResult(null) }}
                    className="text-xs underline text-gray-400 hover:text-gray-600">
                    Run another valuation
                  </button>
                </div>
              )}

              {/* Legal disclaimer — always visible once results show */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-gray-500">Disclaimer:</strong> This estimate is generated algorithmically using publicly available comparable listing data and is provided for informational purposes only. It does not constitute a certified appraisal, broker opinion of value, or guarantee of sale price. Actual market value may vary based on vessel condition, survey findings, location, buyer demand, and negotiation. Breck Yacht Group assumes no liability for decisions made based on this estimate. For a professional assessment, please consult a licensed marine broker or NAMS/SAMS certified surveyor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Broker Quote ────────────────────────────────────────── */}
        <div className="bg-white shadow-sm border border-gray-100 p-8">
          <div className="border-l-4 pl-4 mb-8" style={{ borderColor: '#0c1f3f' }}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Broker Assessment</p>
            <h2 className="text-2xl font-bold" style={{ color: '#0c1f3f' }}>Speak to a Broker</h2>
            <p className="text-sm text-gray-400 mt-1">Personal valuation from Austin within 24 hours</p>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            While our AI tool gives you an instant data-driven range, nothing replaces a broker who knows the market firsthand. Fill out the form below and Austin will review your vessel personally and follow up with a detailed market opinion.
          </p>

          <ValuationForm />
        </div>

      </div>
    </div>
  )
}
