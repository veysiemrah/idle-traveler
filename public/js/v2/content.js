/* V2 world definitions: pure data shared by browser and Node tests. */
(function(root){
'use strict';
const IT=root.IT=root.IT||{}, V=IT.V2=IT.V2||{};
const pair=(tr,en)=>({tr,en});
const WORLDS=[
  {
    "id": "earth",
    "name": {
      "tr": "Yeryüzü",
      "en": "Earth",
      "de": "Erde",
      "es": "Tierra",
      "fr": "Terre"
    },
    "description": {
      "tr": "Yakın yollar, uzak düşler.",
      "en": "Familiar roads, distant dreams.",
      "de": "Vertraute Wege, ferne Träume.",
      "es": "Caminos cercanos, sueños lejanos.",
      "fr": "Routes familières, rêves lointains."
    },
    "index": 0,
    "next": "cloud",
    "clues": [
      {
        "tr": "Eski yol taşında kanatlı bir pusula buldun.",
        "en": "You found a winged compass on an old milestone.",
        "de": "Du fandest einen geflügelten Kompass auf einem Wegstein.",
        "es": "Encontraste una brújula alada en un mojón.",
        "fr": "Tu as trouvé une boussole ailée sur une borne."
      },
      {
        "tr": "Değirmenci, pusulanın rüzgârla döndüğünü hatırlıyor.",
        "en": "The miller remembers that the compass turns with the wind.",
        "de": "Der Müller erinnert sich: Der Kompass dreht sich mit dem Wind.",
        "es": "El molinero recuerda que la brújula gira con el viento.",
        "fr": "Le meunier se souvient que la boussole tourne avec le vent."
      },
      {
        "tr": "Dağdaki gözlemci gökyüzündeki ilk limanı işaretledi.",
        "en": "The mountain observer marked the first sky harbour.",
        "de": "Der Bergbeobachter markierte den ersten Himmelshafen.",
        "es": "El observador de la montaña señaló el primer puerto celeste.",
        "fr": "L’observateur de la montagne a indiqué le premier port céleste."
      }
    ]
  },
  {
    "id": "cloud",
    "name": {
      "tr": "Bulut Adaları",
      "en": "Cloud Islands",
      "de": "Wolkeninseln",
      "es": "Islas de las Nubes",
      "fr": "Îles des Nuages"
    },
    "description": {
      "tr": "Aşağıda dünya, yukarıda yeni limanlar.",
      "en": "The world below, new harbours above.",
      "de": "Die Welt unter dir, neue Häfen über dir.",
      "es": "El mundo abajo, nuevos puertos arriba.",
      "fr": "Le monde en bas, de nouveaux ports en haut."
    },
    "index": 1,
    "next": "storm",
    "clues": [
      {
        "tr": "Bulut postasının zarflarında aynı spiral damga var.",
        "en": "The cloud mail envelopes share a spiral stamp.",
        "de": "Die Wolkenpost trägt denselben Spiralstempel.",
        "es": "Los sobres del correo llevan el mismo sello espiral.",
        "fr": "Les lettres des nuages portent le même sceau spiral."
      },
      {
        "tr": "Kayıp ada pusulası kuzeye değil, bir fırtınaya dönüyor.",
        "en": "The lost island compass points at a storm, not north.",
        "de": "Der Inselkompass zeigt auf einen Sturm statt nach Norden.",
        "es": "La brújula de la isla apunta a una tormenta, no al norte.",
        "fr": "La boussole de l’île pointe vers une tempête, pas vers le nord."
      },
      {
        "tr": "İskeleleri bağlayınca fırtına fenerinden bir yanıt geldi.",
        "en": "Linking the docks brought an answer from a storm beacon.",
        "de": "Die verbundenen Stege empfangen eine Antwort vom Sturmfeuer.",
        "es": "Al conectar los muelles llegó una respuesta de un faro en la tormenta.",
        "fr": "Les quais reliés ont reçu une réponse du phare dans la tempête."
      }
    ]
  },
  {
    "id": "storm",
    "name": {
      "tr": "Fırtına Kuşağı",
      "en": "Storm Belt",
      "de": "Sturmgürtel",
      "es": "Cinturón de Tormentas",
      "fr": "Ceinture des Tempêtes"
    },
    "description": {
      "tr": "Her fırtınanın içinden bir yol geçer.",
      "en": "There is a path through every storm.",
      "de": "Durch jeden Sturm führt ein Weg.",
      "es": "Hay un camino a través de cada tormenta.",
      "fr": "Il existe un chemin à travers chaque tempête."
    },
    "index": 2,
    "next": "upper",
    "clues": [
      {
        "tr": "Fırtınanın gözünde spiral damgalı bir röle buldun.",
        "en": "A relay with a spiral seal sits inside the storm eye.",
        "de": "Im Sturmauge liegt ein Relais mit Spiralsiegel.",
        "es": "En el ojo de la tormenta hay un relé con sello espiral.",
        "fr": "Un relais au sceau spiral se trouve dans l’œil de la tempête."
      },
      {
        "tr": "Onarılan fener sinyali yukarıya, seyrek havaya gönderiyor.",
        "en": "The repaired beacon sends its signal into thinner air.",
        "de": "Das reparierte Feuer sendet sein Signal in dünnere Luft.",
        "es": "El faro reparado envía su señal hacia el aire tenue.",
        "fr": "Le phare réparé envoie son signal vers l’air raréfié."
      },
      {
        "tr": "Şimşekler rastgele değil: yüksek istasyonun kapısını çiziyor.",
        "en": "The lightning traces the entrance to a high station.",
        "de": "Die Blitze zeichnen den Eingang einer Hochstation.",
        "es": "Los rayos dibujan la entrada a una estación elevada.",
        "fr": "Les éclairs dessinent l’entrée d’une station d’altitude."
      }
    ]
  },
  {
    "id": "upper",
    "name": {
      "tr": "Yüksek Atmosfer",
      "en": "Upper Atmosphere",
      "de": "Obere Atmosphäre",
      "es": "Alta Atmósfera",
      "fr": "Haute Atmosphère"
    },
    "description": {
      "tr": "Dünya incelirken rüzgâr bir haritaya dönüşür.",
      "en": "As the world curves away, the wind becomes a map.",
      "de": "Die Welt wird kleiner, der Wind zur Karte.",
      "es": "El mundo se aleja y el viento se vuelve mapa.",
      "fr": "Le monde s’éloigne et le vent devient une carte."
    },
    "index": 3,
    "next": "planets",
    "clues": [
      {
        "tr": "Son akım seni terk edilmiş bir gözlem hattına taşıdı.",
        "en": "The last updraft carried you to an abandoned observation line.",
        "de": "Der letzte Aufwind trug dich zu einer verlassenen Beobachtungslinie.",
        "es": "La última corriente te llevó a una línea de observación abandonada.",
        "fr": "Le dernier courant t’a porté vers une ligne d’observation abandonnée."
      },
      {
        "tr": "İstasyon kaydında aynı spiral, bir yörünge işareti olarak geçiyor.",
        "en": "The station logs identify the spiral as an orbital marker.",
        "de": "Die Stationsaufzeichnungen nennen die Spirale ein Orbitzeichen.",
        "es": "Los registros identifican la espiral como una marca orbital.",
        "fr": "Les archives identifient la spirale comme une balise orbitale."
      },
      {
        "tr": "İlk uzay penceresi açıldı. Mavi ayda çalışan bir anten var.",
        "en": "The first launch window is open. An antenna is active on the blue moon.",
        "de": "Das erste Startfenster ist offen. Auf dem blauen Mond arbeitet eine Antenne.",
        "es": "Se abrió la primera ventana espacial. Una antena sigue activa en la luna azul.",
        "fr": "La première fenêtre de lancement est ouverte. Une antenne fonctionne sur la lune bleue."
      }
    ]
  },
  {
    "id": "planets",
    "name": {
      "tr": "Gezegenler Sistemi",
      "en": "Planetary System",
      "de": "Planetensystem",
      "es": "Sistema Planetario",
      "fr": "Système Planétaire"
    },
    "description": {
      "tr": "Her yörüngede başka bir hayatın izi.",
      "en": "Each orbit holds a trace of another life.",
      "de": "Jede Umlaufbahn birgt eine Spur anderen Lebens.",
      "es": "Cada órbita guarda el rastro de otra vida.",
      "fr": "Chaque orbite garde la trace d’une autre vie."
    },
    "index": 4,
    "next": "nebula",
    "clues": [
      {
        "tr": "Mavi ayın yüzeyinde insan yapımı bir tarama izi var.",
        "en": "An artificial survey trace crosses the blue moon.",
        "de": "Eine künstliche Vermessungsspur zieht sich über den blauen Mond.",
        "es": "Una huella de exploración artificial cruza la luna azul.",
        "fr": "Une trace de relevé artificiel traverse la lune bleue."
      },
      {
        "tr": "Pazardaki yük kayıtları bir gözlemcinin nebulaya gittiğini gösteriyor.",
        "en": "Cargo records show that an observer departed for the nebula.",
        "de": "Frachtlisten zeigen: Ein Beobachter flog in den Nebel.",
        "es": "Los registros de carga indican que un observador partió hacia la nebulosa.",
        "fr": "Les registres de fret indiquent qu’un observateur est parti vers la nébuleuse."
      },
      {
        "tr": "Halka istasyonu gözlemcinin son yankısını kaydetmiş.",
        "en": "The ring station recorded the observer’s final echo.",
        "de": "Die Ringstation zeichnete das letzte Echo des Beobachters auf.",
        "es": "La estación de los anillos grabó el último eco del observador.",
        "fr": "La station des anneaux a enregistré le dernier écho de l’observateur."
      }
    ]
  },
  {
    "id": "nebula",
    "name": {
      "tr": "Nebula Denizi",
      "en": "Nebula Sea",
      "de": "Nebelmeer",
      "es": "Mar de Nebulosas",
      "fr": "Mer des Nébuleuses"
    },
    "description": {
      "tr": "Görünmeyen yolları ışıkla çiz.",
      "en": "Trace invisible paths with light.",
      "de": "Zeichne unsichtbare Wege mit Licht.",
      "es": "Traza caminos invisibles con luz.",
      "fr": "Trace des chemins invisibles avec la lumière."
    },
    "index": 5,
    "next": "deep",
    "clues": [
      {
        "tr": "Nebulanın içindeki iz, bir geminin dönüş yolunu çiziyor.",
        "en": "A trace inside the nebula charts a ship’s return route.",
        "de": "Eine Spur im Nebel zeichnet den Rückweg eines Schiffs.",
        "es": "Un rastro en la nebulosa marca el regreso de una nave.",
        "fr": "Une trace dans la nébuleuse dessine le retour d’un vaisseau."
      },
      {
        "tr": "İki yankı aynı kaynaktan farklı zamanlarda geliyor.",
        "en": "Two echoes arrive from the same source at different times.",
        "de": "Zwei Echos kommen zu verschiedenen Zeiten aus derselben Quelle.",
        "es": "Dos ecos llegan de la misma fuente en momentos distintos.",
        "fr": "Deux échos arrivent de la même source à des moments différents."
      },
      {
        "tr": "Yeniden yanan fener derin uzaydaki uyuyan geçidi gösterdi.",
        "en": "The relit lantern revealed a sleeping gate in deep space.",
        "de": "Die erneuerte Laterne zeigte ein schlafendes Tor im tiefen All.",
        "es": "El faro encendido reveló un portal dormido en el espacio profundo.",
        "fr": "La lanterne rallumée a révélé une porte endormie dans l’espace profond."
      }
    ]
  },
  {
    "id": "deep",
    "name": {
      "tr": "Derin Uzay",
      "en": "Deep Space",
      "de": "Tiefer Weltraum",
      "es": "Espacio Profundo",
      "fr": "Espace Profond"
    },
    "description": {
      "tr": "Sessizliğe hazırlan; eve dönecek bir yol bırak.",
      "en": "Prepare for silence; leave a way home.",
      "de": "Bereite dich auf die Stille vor; lass einen Heimweg offen.",
      "es": "Prepárate para el silencio; deja un camino de regreso.",
      "fr": "Prépare le silence ; laisse un chemin pour rentrer."
    },
    "index": 6,
    "next": "rim",
    "clues": [
      {
        "tr": "Son depoda gelecekteki yolcular için ayrılmış yakıt var.",
        "en": "The last depot holds fuel reserved for future travelers.",
        "de": "Das letzte Depot enthält Treibstoff für zukünftige Reisende.",
        "es": "El último depósito guarda combustible para futuros viajeros.",
        "fr": "Le dernier dépôt conserve du carburant pour les futurs voyageurs."
      },
      {
        "tr": "Sonda bir zamanlar çalışan büyük bir geçit ağını kaydetmiş.",
        "en": "The probe recorded a vast gate network that once worked.",
        "de": "Die Sonde zeichnete ein einst aktives großes Tornetz auf.",
        "es": "La sonda registró una vasta red de portales antes activa.",
        "fr": "La sonde a enregistré un vaste réseau de portes autrefois actif."
      },
      {
        "tr": "Uyandırılan geçit galaksinin eşiğindeki bir sinyale kilitlendi.",
        "en": "The awakened gate locked onto a signal at the galaxy’s edge.",
        "de": "Das erwachte Tor erfasst ein Signal am Galaxienrand.",
        "es": "El portal despierto se fijó en una señal del borde de la galaxia.",
        "fr": "La porte réveillée s’est verrouillée sur un signal au bord de la galaxie."
      }
    ]
  },
  {
    "id": "rim",
    "name": {
      "tr": "Galaksinin Eşiği",
      "en": "Galaxy’s Edge",
      "de": "Rand der Galaxie",
      "es": "Borde de la Galaxia",
      "fr": "Bord de la Galaxie"
    },
    "description": {
      "tr": "Yıldızlar azalıyor. Bir sinyal hâlâ seni çağırıyor.",
      "en": "The stars grow sparse. A signal still calls you.",
      "de": "Die Sterne werden seltener. Ein Signal ruft dich noch.",
      "es": "Las estrellas escasean. Una señal aún te llama.",
      "fr": "Les étoiles se raréfient. Un signal t’appelle encore."
    },
    "index": 7,
    "next": "void",
    "clues": [
      {
        "tr": "Sinyal doğal bir yıldız olayı değil; düzenli koordinatlar taşıyor.",
        "en": "The signal carries regular coordinates; it is not a stellar event.",
        "de": "Das Signal trägt regelmäßige Koordinaten; es ist kein Sternereignis.",
        "es": "La señal lleva coordenadas regulares; no es un fenómeno estelar.",
        "fr": "Le signal porte des coordonnées régulières ; ce n’est pas un phénomène stellaire."
      },
      {
        "tr": "Son yıldızın arşivi sinyali eski geçit ağına bağlıyor.",
        "en": "The last star archive connects the signal to the ancient gate network.",
        "de": "Das Archiv des letzten Sterns verbindet das Signal mit dem alten Tornetz.",
        "es": "El archivo de la última estrella vincula la señal con la antigua red de portales.",
        "fr": "Les archives de la dernière étoile relient le signal à l’ancien réseau de portes."
      },
      {
        "tr": "Koordinatlar galaksilerarası boşlukta sürüklenen bir röleye gidiyor.",
        "en": "The coordinates lead to a drifting relay in the intergalactic void.",
        "de": "Die Koordinaten führen zu einem Relais in der intergalaktischen Leere.",
        "es": "Las coordenadas conducen a un relé a la deriva en el vacío intergaláctico.",
        "fr": "Les coordonnées mènent à un relais à la dérive dans le vide intergalactique."
      }
    ]
  },
  {
    "id": "void",
    "name": {
      "tr": "Galaksilerarası Boşluk",
      "en": "Intergalactic Void",
      "de": "Intergalaktische Leere",
      "es": "Vacío Intergaláctico",
      "fr": "Vide Intergalactique"
    },
    "description": {
      "tr": "Karanlıkta yalnızca bıraktığın işaretler var.",
      "en": "In the dark, only the beacons you leave remain.",
      "de": "Im Dunkeln bleiben nur deine Wegzeichen.",
      "es": "En la oscuridad solo quedan tus balizas.",
      "fr": "Dans le noir, seules tes balises demeurent."
    },
    "index": 8,
    "next": "galaxies",
    "clues": [
      {
        "tr": "Röle, terk edilmeden önce son bir istasyona bağlanmış.",
        "en": "Before being abandoned, the relay linked to one last station.",
        "de": "Vor dem Verlassen war das Relais mit einer letzten Station verbunden.",
        "es": "Antes de abandonarlo, el relé enlazaba con una última estación.",
        "fr": "Avant son abandon, le relais était lié à une dernière station."
      },
      {
        "tr": "İstasyon defteri bekçinin köprüyü kapatmadığını söylüyor.",
        "en": "The station log says the gatekeeper never closed the bridge.",
        "de": "Das Stationsbuch sagt: Der Wächter schloss die Brücke nie.",
        "es": "El diario de la estación dice que el guardián nunca cerró el puente.",
        "fr": "Le journal de la station dit que le gardien n’a jamais fermé le pont."
      },
      {
        "tr": "İlk köprü açıldı; ötesinde birbirine bağlı galaksiler var.",
        "en": "The first bridge is open; connected galaxies lie beyond it.",
        "de": "Die erste Brücke ist offen; dahinter liegen verbundene Galaxien.",
        "es": "El primer puente está abierto; más allá hay galaxias conectadas.",
        "fr": "Le premier pont est ouvert ; des galaxies reliées se trouvent au-delà."
      }
    ]
  },
  {
    "id": "galaxies",
    "name": {
      "tr": "Galaksiler Ağı",
      "en": "Galaxy Network",
      "de": "Galaxiennetz",
      "es": "Red de Galaxias",
      "fr": "Réseau de Galaxies"
    },
    "description": {
      "tr": "Bir yolcu olarak geldin. Şimdi yollar kuruyorsun.",
      "en": "You arrived a traveler. Now you build the roads.",
      "de": "Du kamst als Reisender. Jetzt baust du Wege.",
      "es": "Llegaste como viajero. Ahora construyes caminos.",
      "fr": "Tu es arrivé en voyageur. Maintenant tu traces les routes."
    },
    "index": 9,
    "next": "fracture",
    "clues": [
      {
        "tr": "Spiral atlas üç ayrı keşif hattını ortaya çıkardı.",
        "en": "The spiral atlas revealed three separate exploration routes.",
        "de": "Der Spiralatlas zeigt drei unabhängige Erkundungsrouten.",
        "es": "El atlas espiral reveló tres rutas de exploración separadas.",
        "fr": "L’atlas spiral a révélé trois routes d’exploration distinctes."
      },
      {
        "tr": "Filonun kayıtları sinyalin merkezde kırıldığını doğruladı.",
        "en": "Fleet records confirm that the signal fractures at the centre.",
        "de": "Flottenaufzeichnungen bestätigen den Signalbruch im Zentrum.",
        "es": "Los registros de la flota confirman que la señal se fractura en el centro.",
        "fr": "Les relevés de la flotte confirment que le signal se fracture au centre."
      },
      {
        "tr": "Ağın merkezinde bozulmuş bir uzay geçidi bulundu.",
        "en": "A damaged space gate was found at the network’s centre.",
        "de": "Im Zentrum des Netzes wurde ein beschädigtes Raumtor entdeckt.",
        "es": "Se encontró un portal dañado en el centro de la red.",
        "fr": "Une porte spatiale endommagée a été découverte au centre du réseau."
      }
    ]
  },
  {
    "id": "fracture",
    "name": {
      "tr": "Kırık Uzay",
      "en": "Fractured Space",
      "de": "Gebrochener Raum",
      "es": "Espacio Fracturado",
      "fr": "Espace Fracturé"
    },
    "description": {
      "tr": "En kısa yol, en hızlı yol olmayabilir.",
      "en": "The shortest route may not be the fastest.",
      "de": "Der kürzeste Weg ist nicht immer der schnellste.",
      "es": "El camino más corto quizá no sea el más rápido.",
      "fr": "Le chemin le plus court n’est pas toujours le plus rapide."
    },
    "index": 10,
    "next": "frontier",
    "clues": [
      {
        "tr": "Geri akan saat, iki bölgenin zaman farkını ölçüyor.",
        "en": "The backward clock measures the time drift between two regions.",
        "de": "Die Rückwärtsuhr misst die Zeitabweichung zweier Regionen.",
        "es": "El reloj inverso mide el desfase temporal entre dos regiones.",
        "fr": "L’horloge inversée mesure le décalage temporel entre deux régions."
      },
      {
        "tr": "Katlanmış yolun iki ucu aynı geçide çıkıyor.",
        "en": "Both ends of the folded road lead to the same gate.",
        "de": "Beide Enden des gefalteten Weges führen zum selben Tor.",
        "es": "Ambos extremos del camino plegado llevan al mismo portal.",
        "fr": "Les deux extrémités de la route repliée mènent à la même porte."
      },
      {
        "tr": "Geçit onarıldı. İlk mesajın tamamı öbür tarafta korunmuş.",
        "en": "The gate is repaired. The complete first message survives on the other side.",
        "de": "Das Tor ist repariert. Die erste Nachricht ist jenseits vollständig erhalten.",
        "es": "El portal está reparado. El primer mensaje completo sigue al otro lado.",
        "fr": "La porte est réparée. Le premier message complet subsiste de l’autre côté."
      }
    ]
  },
  {
    "id": "frontier",
    "name": {
      "tr": "Bilinmeyen Sınır",
      "en": "Unknown Frontier",
      "de": "Unbekannte Grenze",
      "es": "Frontera Desconocida",
      "fr": "Frontière Inconnue"
    },
    "description": {
      "tr": "Sinyalin ardında bir son değil, bir başlangıç var.",
      "en": "Beyond the signal lies a beginning.",
      "de": "Hinter dem Signal liegt ein Anfang.",
      "es": "Más allá de la señal hay un comienzo.",
      "fr": "Au-delà du signal commence une nouvelle histoire."
    },
    "index": 11,
    "next": null,
    "clues": [
      {
        "tr": "Sinyal bir yardım çağrısı değil, bekçinin yol tarifiydi.",
        "en": "The signal was the gatekeeper’s directions, not a distress call.",
        "de": "Das Signal war die Wegbeschreibung des Wächters, kein Notruf.",
        "es": "La señal eran las indicaciones del guardián, no una llamada de auxilio.",
        "fr": "Le signal était l’itinéraire du gardien, pas un appel de détresse."
      },
      {
        "tr": "Bekçi yolları sonraki yolcular için açık bırakmış.",
        "en": "The gatekeeper left the roads open for travelers yet to come.",
        "de": "Der Wächter ließ die Wege für kommende Reisende offen.",
        "es": "El guardián dejó los caminos abiertos para los viajeros que llegarían.",
        "fr": "Le gardien a laissé les routes ouvertes aux voyageurs à venir."
      },
      {
        "tr": "Yeni sistemin ilk haritası artık sende. Bağladığın hatlarda yeni seferler seni bekliyor.",
        "en": "The new system’s first map is yours. New expeditions await along the links you built.",
        "de": "Die erste Karte des neuen Systems gehört dir. Auf deinen Verbindungen warten weitere Expeditionen.",
        "es": "El primer mapa del nuevo sistema es tuyo. Te esperan expediciones por los enlaces que creaste.",
        "fr": "La première carte du nouveau système est à toi. Des expéditions t’attendent sur les liens que tu as créés."
      },
      {
        "tr": "Yeni sistemin ilk okyanus haritası tamamlandı.",
        "en": "The new system’s first ocean map is complete.",
        "de": "Die erste Ozeankarte des neuen Systems ist fertig.",
        "es": "El primer mapa oceánico del nuevo sistema está completo.",
        "fr": "La première carte océanique du nouveau système est terminée."
      },
      {
        "tr": "Yeni limanın ışıkları artık başka yolculara da yol gösteriyor.",
        "en": "The new harbour lights now guide other travelers.",
        "de": "Die Lichter des neuen Hafens führen nun weitere Reisende.",
        "es": "Las luces del nuevo puerto guían a otros viajeros.",
        "fr": "Les lumières du nouveau port guident désormais d’autres voyageurs."
      },
      {
        "tr": "Bekçinin bıraktığı yola senin haritan da eklendi.",
        "en": "Your map has joined the road the gatekeeper left behind.",
        "de": "Deine Karte ergänzt nun den Weg des Wächters.",
        "es": "Tu mapa se sumó al camino que dejó el guardián.",
        "fr": "Ta carte rejoint la route laissée par le gardien."
      }
    ]
  }
];
const TEMPLATES=[
  {
    "id": "earth-survey",
    "worldId": "earth",
    "name": {
      "tr": "Yolun Hatırası",
      "en": "Road Memory",
      "de": "Erinnerung des Weges",
      "es": "Memoria del Camino",
      "fr": "Mémoire de la Route"
    },
    "index": 0,
    "nodes": [
      {
        "id": "earth-survey-0",
        "seconds": 300,
        "choices": [
          {
            "id": "earth-survey-0-0",
            "text": {
              "tr": "Dere kenarındaki izleri takip et",
              "en": "Follow the river tracks",
              "de": "Folge den Spuren am Fluss",
              "es": "Sigue los rastros del río",
              "fr": "Suis les traces de la rivière"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "earth-survey-0-1",
            "text": {
              "tr": "Köy yolundan yardım iste",
              "en": "Ask for help along the village road",
              "de": "Bitte im Dorf um Hilfe",
              "es": "Pide ayuda en el pueblo",
              "fr": "Demande de l’aide au village"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "earth-survey-1",
        "seconds": 240,
        "choices": [
          {
            "id": "earth-survey-1-0",
            "text": {
              "tr": "Eski köprüyü onar",
              "en": "Repair the old bridge",
              "de": "Repariere die alte Brücke",
              "es": "Repara el puente antiguo",
              "fr": "Répare le vieux pont"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "earth-survey-1-1",
            "text": {
              "tr": "Yükü küçük teknelere böl",
              "en": "Split the cargo among small boats",
              "de": "Verteile die Fracht auf kleine Boote",
              "es": "Reparte la carga entre barcas",
              "fr": "Répartis le fret entre des barques"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "earth-survey-2",
        "seconds": 240
      }
    ],
    "clueId": "earth-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "earth-delivery",
    "worldId": "earth",
    "name": {
      "tr": "Değirmenin Emaneti",
      "en": "Mill Delivery",
      "de": "Lieferung zur Mühle",
      "es": "Entrega al Molino",
      "fr": "Livraison au Moulin"
    },
    "index": 1,
    "nodes": [
      {
        "id": "earth-delivery-0",
        "seconds": 300,
        "choices": [
          {
            "id": "earth-delivery-0-0",
            "text": {
              "tr": "Un çuvallarını kuru yoldan taşı",
              "en": "Carry flour along the dry road",
              "de": "Trage Mehl auf dem trockenen Weg",
              "es": "Lleva harina por el camino seco",
              "fr": "Transporte la farine par le chemin sec"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "earth-delivery-0-1",
            "text": {
              "tr": "Yükü dere kayıklarına böl",
              "en": "Split the flour between river boats",
              "de": "Verteile das Mehl auf Flussboote",
              "es": "Reparte la harina entre barcas",
              "fr": "Répartis la farine entre les barques"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "earth-delivery-1",
        "seconds": 240,
        "choices": [
          {
            "id": "earth-delivery-1-0",
            "text": {
              "tr": "Değirmenin çarkını onar",
              "en": "Repair the mill wheel",
              "de": "Repariere das Mühlrad",
              "es": "Repara la rueda del molino",
              "fr": "Répare la roue du moulin"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "earth-delivery-1-1",
            "text": {
              "tr": "Köylülerden taşıma yardımı iste",
              "en": "Ask villagers to help carry the load",
              "de": "Bitte die Dorfbewohner um Tragehilfe",
              "es": "Pide ayuda para llevar la carga",
              "fr": "Demande aux villageois de porter la charge"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "earth-delivery-2",
        "seconds": 240
      }
    ],
    "clueId": "earth-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "earth-pass",
    "worldId": "earth",
    "name": {
      "tr": "Dağ Geçidi",
      "en": "Mountain Pass",
      "de": "Gebirgspass",
      "es": "Paso de Montaña",
      "fr": "Col de Montagne"
    },
    "index": 2,
    "nodes": [
      {
        "id": "earth-pass-0",
        "seconds": 300,
        "choices": [
          {
            "id": "earth-pass-0-0",
            "text": {
              "tr": "Eski dağ izini araştır",
              "en": "Survey the old mountain track",
              "de": "Erkunde den alten Bergpfad",
              "es": "Explora la senda de montaña",
              "fr": "Explore l’ancien sentier de montagne"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "earth-pass-0-1",
            "text": {
              "tr": "Vadinin uzun yolunda kal",
              "en": "Keep to the long valley road",
              "de": "Bleib auf dem langen Talweg",
              "es": "Sigue el camino largo del valle",
              "fr": "Reste sur la longue route de la vallée"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "earth-pass-1",
        "seconds": 240,
        "choices": [
          {
            "id": "earth-pass-1-0",
            "text": {
              "tr": "Geçidin taşlarını sağlamlaştır",
              "en": "Reinforce the pass stones",
              "de": "Befestige die Steine im Pass",
              "es": "Refuerza las piedras del paso",
              "fr": "Renforce les pierres du col"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "earth-pass-1-1",
            "text": {
              "tr": "Gözlem kulübesine tırman",
              "en": "Climb to the lookout hut",
              "de": "Steige zur Beobachtungshütte",
              "es": "Sube a la cabaña de observación",
              "fr": "Monte à la cabane d’observation"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "earth-pass-2",
        "seconds": 240
      }
    ],
    "clueId": "earth-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "cloud-delivery",
    "worldId": "cloud",
    "name": {
      "tr": "Bulut Postası",
      "en": "Cloud Mail",
      "de": "Wolkenpost",
      "es": "Correo de las Nubes",
      "fr": "Courrier des Nuages"
    },
    "index": 0,
    "nodes": [
      {
        "id": "cloud-delivery-0",
        "seconds": 300,
        "choices": [
          {
            "id": "cloud-delivery-0-0",
            "text": {
              "tr": "Postayı küçük adalara dağıt",
              "en": "Deliver to the smaller islands",
              "de": "Liefere an die kleinen Inseln",
              "es": "Entrega en las islas pequeñas",
              "fr": "Livre les petites îles"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "cloud-delivery-0-1",
            "text": {
              "tr": "Yüksek rüzgârla kısa yolu dene",
              "en": "Ride the high wind shortcut",
              "de": "Nutze die Abkürzung im Höhenwind",
              "es": "Toma el atajo del viento alto",
              "fr": "Prends le raccourci du vent d’altitude"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "cloud-delivery-1",
        "seconds": 240,
        "choices": [
          {
            "id": "cloud-delivery-1-0",
            "text": {
              "tr": "Limanın kopuk bağını onar",
              "en": "Repair the harbour connection",
              "de": "Repariere die Hafenverbindung",
              "es": "Repara la conexión del puerto",
              "fr": "Répare la liaison du port"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "cloud-delivery-1-1",
            "text": {
              "tr": "Yeni bir ada rotası çiz",
              "en": "Chart a new island route",
              "de": "Kartiere eine neue Inselroute",
              "es": "Traza una nueva ruta insular",
              "fr": "Trace une nouvelle route insulaire"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "cloud-delivery-2",
        "seconds": 240
      }
    ],
    "clueId": "cloud-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "cloud-survey",
    "worldId": "cloud",
    "name": {
      "tr": "Kayıp Ada",
      "en": "Lost Island",
      "de": "Verlorene Insel",
      "es": "Isla Perdida",
      "fr": "Île Perdue"
    },
    "index": 1,
    "nodes": [
      {
        "id": "cloud-survey-0",
        "seconds": 300,
        "choices": [
          {
            "id": "cloud-survey-0-0",
            "text": {
              "tr": "Bulut gölgesindeki adayı tara",
              "en": "Scan the island beneath the cloud shadow",
              "de": "Scanne die Insel unter dem Wolkenschatten",
              "es": "Escanea la isla bajo la sombra",
              "fr": "Scanne l’île sous l’ombre du nuage"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "cloud-survey-0-1",
            "text": {
              "tr": "Haritalı limanda bilgi topla",
              "en": "Gather information at the charted harbour",
              "de": "Sammle Hinweise im kartierten Hafen",
              "es": "Busca información en el puerto conocido",
              "fr": "Renseigne-toi au port cartographié"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "cloud-survey-1",
        "seconds": 240,
        "choices": [
          {
            "id": "cloud-survey-1-0",
            "text": {
              "tr": "Adanın dönen pusulasını incele",
              "en": "Examine the island’s spinning compass",
              "de": "Untersuche den drehenden Inselkompass",
              "es": "Examina la brújula giratoria",
              "fr": "Examine la boussole tournante"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "cloud-survey-1-1",
            "text": {
              "tr": "Güvenli iniş için iskele kur",
              "en": "Build a jetty for a safe landing",
              "de": "Baue einen sicheren Landesteg",
              "es": "Construye un muelle seguro",
              "fr": "Construis un quai sûr"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "cloud-survey-2",
        "seconds": 240
      }
    ],
    "clueId": "cloud-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "cloud-link",
    "worldId": "cloud",
    "name": {
      "tr": "Gökyüzü İskelesi",
      "en": "Sky Dock",
      "de": "Himmelssteg",
      "es": "Muelle del Cielo",
      "fr": "Quai du Ciel"
    },
    "index": 2,
    "nodes": [
      {
        "id": "cloud-link-0",
        "seconds": 300,
        "choices": [
          {
            "id": "cloud-link-0-0",
            "text": {
              "tr": "Yüzen iskelenin halatını değiştir",
              "en": "Replace the floating dock’s tether",
              "de": "Ersetze das Halteseil des Stegs",
              "es": "Cambia la amarra del muelle",
              "fr": "Remplace l’amarre du quai flottant"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "cloud-link-0-1",
            "text": {
              "tr": "Malzemeyi küçük seferlerle taşı",
              "en": "Carry materials in small deliveries",
              "de": "Bringe Material in kleinen Lieferungen",
              "es": "Lleva material en entregas pequeñas",
              "fr": "Transporte les matériaux par petits lots"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "cloud-link-1",
        "seconds": 240,
        "choices": [
          {
            "id": "cloud-link-1-0",
            "text": {
              "tr": "İki liman arasına fener koy",
              "en": "Place a beacon between the harbours",
              "de": "Setze ein Leuchtfeuer zwischen die Häfen",
              "es": "Pon una baliza entre los puertos",
              "fr": "Place une balise entre les ports"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "cloud-link-1-1",
            "text": {
              "tr": "Akıntıya paralel ikinci hat aç",
              "en": "Open a second route along the current",
              "de": "Öffne eine zweite Strömungsroute",
              "es": "Abre otra ruta junto a la corriente",
              "fr": "Ouvre une seconde route dans le courant"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "cloud-link-2",
        "seconds": 240
      }
    ],
    "clueId": "cloud-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "storm-shelter",
    "worldId": "storm",
    "name": {
      "tr": "Fırtınanın Gözü",
      "en": "Storm Eye",
      "de": "Sturmauge",
      "es": "Ojo de la Tormenta",
      "fr": "Œil de la Tempête"
    },
    "index": 0,
    "nodes": [
      {
        "id": "storm-shelter-0",
        "seconds": 300,
        "choices": [
          {
            "id": "storm-shelter-0-0",
            "text": {
              "tr": "Fırtınanın çevresinden dolaş",
              "en": "Take shelter around the storm",
              "de": "Umgehe den Sturm geschützt",
              "es": "Rodéate de refugio ante la tormenta",
              "fr": "Contourne la tempête à l’abri"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          },
          {
            "id": "storm-shelter-0-1",
            "text": {
              "tr": "Korumalı gövdeyle gözden geç",
              "en": "Cross the eye with a reinforced hull",
              "de": "Durchquere das Auge mit verstärktem Rumpf",
              "es": "Cruza el ojo con casco reforzado",
              "fr": "Traverse l’œil avec une coque renforcée"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          }
        ]
      },
      {
        "id": "storm-shelter-1",
        "seconds": 240,
        "choices": [
          {
            "id": "storm-shelter-1-0",
            "text": {
              "tr": "Feneri yeniden yak",
              "en": "Relight the beacon",
              "de": "Entzünde das Leuchtfeuer erneut",
              "es": "Enciende de nuevo el faro",
              "fr": "Rallume le phare"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "storm-shelter-1-1",
            "text": {
              "tr": "Bekleyen yolcuları taşı",
              "en": "Carry the waiting travelers",
              "de": "Nimm die wartenden Reisenden mit",
              "es": "Transporta a los viajeros que esperan",
              "fr": "Transporte les voyageurs en attente"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "storm-shelter-2",
        "seconds": 240
      }
    ],
    "clueId": "storm-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "storm-rescue",
    "worldId": "storm",
    "name": {
      "tr": "Sessiz Fener",
      "en": "Silent Beacon",
      "de": "Stilles Leuchtfeuer",
      "es": "Faro Silencioso",
      "fr": "Phare Silencieux"
    },
    "index": 1,
    "nodes": [
      {
        "id": "storm-rescue-0",
        "seconds": 300,
        "choices": [
          {
            "id": "storm-rescue-0-0",
            "text": {
              "tr": "Fenerin kırık siperini onar",
              "en": "Repair the beacon’s broken shelter",
              "de": "Repariere den Schutz des Leuchtfeuers",
              "es": "Repara el refugio del faro",
              "fr": "Répare l’abri du phare"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          },
          {
            "id": "storm-rescue-0-1",
            "text": {
              "tr": "Yolcuları dış limana götür",
              "en": "Take travelers to the outer harbour",
              "de": "Bringe Reisende zum Außenhafen",
              "es": "Lleva viajeros al puerto exterior",
              "fr": "Conduis les voyageurs au port extérieur"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          }
        ]
      },
      {
        "id": "storm-rescue-1",
        "seconds": 240,
        "choices": [
          {
            "id": "storm-rescue-1-0",
            "text": {
              "tr": "Kesilen güç hattına yaklaş",
              "en": "Approach the severed power line",
              "de": "Nähere dich der gerissenen Stromleitung",
              "es": "Acércate al cable cortado",
              "fr": "Approche le câble coupé"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "storm-rescue-1-1",
            "text": {
              "tr": "Feneri yedek pille çalıştır",
              "en": "Power the beacon with a spare cell",
              "de": "Betreibe das Feuer mit einer Ersatzbatterie",
              "es": "Alimenta el faro con una batería",
              "fr": "Alimente le phare avec une batterie"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "storm-rescue-2",
        "seconds": 240
      }
    ],
    "clueId": "storm-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "storm-crossing",
    "worldId": "storm",
    "name": {
      "tr": "Şimşek Koridoru",
      "en": "Lightning Corridor",
      "de": "Blitzkorridor",
      "es": "Corredor de Rayos",
      "fr": "Couloir des Éclairs"
    },
    "index": 2,
    "nodes": [
      {
        "id": "storm-crossing-0",
        "seconds": 300,
        "choices": [
          {
            "id": "storm-crossing-0-0",
            "text": {
              "tr": "Şimşeklerin düzenini gözle",
              "en": "Observe the pattern of lightning",
              "de": "Beobachte das Blitzmuster",
              "es": "Observa el patrón de los rayos",
              "fr": "Observe le rythme des éclairs"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          },
          {
            "id": "storm-crossing-0-1",
            "text": {
              "tr": "Sessiz koridorun açılmasını bekle",
              "en": "Wait for the quiet corridor",
              "de": "Warte auf den stillen Korridor",
              "es": "Espera el corredor tranquilo",
              "fr": "Attends le couloir calme"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          }
        ]
      },
      {
        "id": "storm-crossing-1",
        "seconds": 240,
        "choices": [
          {
            "id": "storm-crossing-1-0",
            "text": {
              "tr": "Kısa aralıkta geçidi aş",
              "en": "Cross during the short opening",
              "de": "Nutze die kurze Öffnung",
              "es": "Cruza en la apertura breve",
              "fr": "Traverse pendant la courte ouverture"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "storm-crossing-1-1",
            "text": {
              "tr": "Geniş korumalı yayı takip et",
              "en": "Follow the wide sheltered arc",
              "de": "Folge dem weiten geschützten Bogen",
              "es": "Sigue el arco amplio protegido",
              "fr": "Suis le grand arc protégé"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "storm-crossing-2",
        "seconds": 240
      }
    ],
    "clueId": "storm-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "upper-glide",
    "worldId": "upper",
    "name": {
      "tr": "Son Hava Akımı",
      "en": "Last Updraft",
      "de": "Letzter Aufwind",
      "es": "Última Corriente",
      "fr": "Dernier Courant"
    },
    "index": 0,
    "nodes": [
      {
        "id": "upper-glide-0",
        "seconds": 300,
        "choices": [
          {
            "id": "upper-glide-0-0",
            "text": {
              "tr": "İstasyonda enerjiyi doldur",
              "en": "Recharge at the station",
              "de": "Lade an der Station auf",
              "es": "Recarga en la estación",
              "fr": "Recharge à la station"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          },
          {
            "id": "upper-glide-0-1",
            "text": {
              "tr": "Sıcak hava akımında süzül",
              "en": "Glide on the thermal current",
              "de": "Gleite im warmen Aufwind",
              "es": "Planea sobre la corriente térmica",
              "fr": "Plane sur le courant thermique"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          }
        ]
      },
      {
        "id": "upper-glide-1",
        "seconds": 240,
        "choices": [
          {
            "id": "upper-glide-1-0",
            "text": {
              "tr": "Yedek enerjiyi antene ayır",
              "en": "Divert reserve energy to the antenna",
              "de": "Versorge die Antenne mit Reserveenergie",
              "es": "Da energía de reserva a la antena",
              "fr": "Alimente l’antenne avec la réserve"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "upper-glide-1-1",
            "text": {
              "tr": "Bir sonraki istasyona sakla",
              "en": "Save energy for the next station",
              "de": "Spare Energie für die nächste Station",
              "es": "Guarda energía para la siguiente estación",
              "fr": "Garde l’énergie pour la station suivante"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "upper-glide-2",
        "seconds": 240
      }
    ],
    "clueId": "upper-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "upper-station",
    "worldId": "upper",
    "name": {
      "tr": "Yüksek İstasyon",
      "en": "High Station",
      "de": "Hochstation",
      "es": "Estación Elevada",
      "fr": "Station d’Altitude"
    },
    "index": 1,
    "nodes": [
      {
        "id": "upper-station-0",
        "seconds": 300,
        "choices": [
          {
            "id": "upper-station-0-0",
            "text": {
              "tr": "Boş yakıt hücrelerini değiştir",
              "en": "Replace the empty fuel cells",
              "de": "Ersetze die leeren Brennstoffzellen",
              "es": "Cambia las células vacías",
              "fr": "Remplace les cellules vides"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          },
          {
            "id": "upper-station-0-1",
            "text": {
              "tr": "İstasyonun güneş panelinde dolum yap",
              "en": "Recharge at the station’s solar panel",
              "de": "Lade am Solarpanel der Station auf",
              "es": "Recarga en el panel solar",
              "fr": "Recharge au panneau solaire"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          }
        ]
      },
      {
        "id": "upper-station-1",
        "seconds": 240,
        "choices": [
          {
            "id": "upper-station-1-0",
            "text": {
              "tr": "Eski hava kayıtlarını çöz",
              "en": "Decode the old atmospheric records",
              "de": "Entschlüssele die alten Atmosphärendaten",
              "es": "Descifra los registros atmosféricos",
              "fr": "Décode les relevés atmosphériques"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "upper-station-1-1",
            "text": {
              "tr": "İstasyona yedek enerji bırak",
              "en": "Leave reserve energy at the station",
              "de": "Lass Reserveenergie an der Station",
              "es": "Deja energía de reserva",
              "fr": "Laisse une réserve d’énergie"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "upper-station-2",
        "seconds": 240
      }
    ],
    "clueId": "upper-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "upper-launch",
    "worldId": "upper",
    "name": {
      "tr": "Yıldızlara İlk Adım",
      "en": "First Step to the Stars",
      "de": "Erster Schritt zu den Sternen",
      "es": "Primer Paso a las Estrellas",
      "fr": "Premier Pas vers les Étoiles"
    },
    "index": 2,
    "nodes": [
      {
        "id": "upper-launch-0",
        "seconds": 300,
        "choices": [
          {
            "id": "upper-launch-0-0",
            "text": {
              "tr": "Son hava akımına doğru yüksel",
              "en": "Climb into the final updraft",
              "de": "Steige in den letzten Aufwind",
              "es": "Sube a la última corriente",
              "fr": "Monte dans le dernier courant"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          },
          {
            "id": "upper-launch-0-1",
            "text": {
              "tr": "Yörünge penceresine kadar bekle",
              "en": "Wait for the orbital window",
              "de": "Warte auf das Orbitfenster",
              "es": "Espera la ventana orbital",
              "fr": "Attends la fenêtre orbitale"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          }
        ]
      },
      {
        "id": "upper-launch-1",
        "seconds": 240,
        "choices": [
          {
            "id": "upper-launch-1-0",
            "text": {
              "tr": "Antenini yıldızlara çevir",
              "en": "Turn the antenna toward the stars",
              "de": "Richte die Antenne auf die Sterne",
              "es": "Apunta la antena a las estrellas",
              "fr": "Tourne l’antenne vers les étoiles"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "upper-launch-1-1",
            "text": {
              "tr": "Enerjiyi ilk uzay limanına sakla",
              "en": "Save energy for the first spaceport",
              "de": "Spare Energie für den ersten Raumhafen",
              "es": "Guarda energía para el primer puerto espacial",
              "fr": "Garde l’énergie pour le premier port spatial"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "upper-launch-2",
        "seconds": 240
      }
    ],
    "clueId": "upper-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "planets-survey",
    "worldId": "planets",
    "name": {
      "tr": "Mavi Ay",
      "en": "Blue Moon",
      "de": "Blauer Mond",
      "es": "Luna Azul",
      "fr": "Lune Bleue"
    },
    "index": 0,
    "nodes": [
      {
        "id": "planets-survey-0",
        "seconds": 300,
        "choices": [
          {
            "id": "planets-survey-0-0",
            "text": {
              "tr": "Ay yüzeyini araştır",
              "en": "Survey the moon surface",
              "de": "Erkunde die Mondoberfläche",
              "es": "Explora la superficie lunar",
              "fr": "Explore la surface lunaire"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "planets-survey-0-1",
            "text": {
              "tr": "Koloniye tedarik götür",
              "en": "Take supplies to the colony",
              "de": "Versorge die Kolonie",
              "es": "Lleva suministros a la colonia",
              "fr": "Ravitaille la colonie"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "planets-survey-1",
        "seconds": 240,
        "choices": [
          {
            "id": "planets-survey-1-0",
            "text": {
              "tr": "Yörüngeyi dikkatle haritala",
              "en": "Map the orbit carefully",
              "de": "Kartiere die Umlaufbahn sorgfältig",
              "es": "Cartografía la órbita con cuidado",
              "fr": "Cartographie soigneusement l’orbite"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "planets-survey-1-1",
            "text": {
              "tr": "Ticaret halkasına yanaş",
              "en": "Dock at the trading ring",
              "de": "Docke am Handelsring an",
              "es": "Atraca en el anillo comercial",
              "fr": "Accoste à l’anneau commercial"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "planets-survey-2",
        "seconds": 240
      }
    ],
    "clueId": "planets-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "planets-supply",
    "worldId": "planets",
    "name": {
      "tr": "Yörünge Pazarı",
      "en": "Orbital Market",
      "de": "Orbitalmarkt",
      "es": "Mercado Orbital",
      "fr": "Marché Orbital"
    },
    "index": 1,
    "nodes": [
      {
        "id": "planets-supply-0",
        "seconds": 300,
        "choices": [
          {
            "id": "planets-supply-0-0",
            "text": {
              "tr": "Koloninin su depolarını doldur",
              "en": "Fill the colony’s water tanks",
              "de": "Fülle die Wassertanks der Kolonie",
              "es": "Llena los depósitos de agua",
              "fr": "Remplis les réservoirs d’eau"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "planets-supply-0-1",
            "text": {
              "tr": "Yükü yörünge deposunda paylaştır",
              "en": "Distribute cargo at the orbital depot",
              "de": "Verteile Fracht im Orbitaldepot",
              "es": "Reparte carga en el depósito orbital",
              "fr": "Répartis le fret au dépôt orbital"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "planets-supply-1",
        "seconds": 240,
        "choices": [
          {
            "id": "planets-supply-1-0",
            "text": {
              "tr": "Ay madencilerine parça taşı",
              "en": "Bring parts to the moon miners",
              "de": "Bringe Ersatzteile zu den Mondbergleuten",
              "es": "Lleva piezas a los mineros lunares",
              "fr": "Apporte des pièces aux mineurs lunaires"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "planets-supply-1-1",
            "text": {
              "tr": "Pazarda ikinci tedarik hattı kur",
              "en": "Set up a second supply route at the market",
              "de": "Baue eine zweite Versorgungsroute",
              "es": "Abre una segunda ruta de suministro",
              "fr": "Ouvre une seconde route de ravitaillement"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "planets-supply-2",
        "seconds": 240
      }
    ],
    "clueId": "planets-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "planets-orbit",
    "worldId": "planets",
    "name": {
      "tr": "Halka İstasyonu",
      "en": "Ring Station",
      "de": "Ringstation",
      "es": "Estación de los Anillos",
      "fr": "Station des Anneaux"
    },
    "index": 2,
    "nodes": [
      {
        "id": "planets-orbit-0",
        "seconds": 300,
        "choices": [
          {
            "id": "planets-orbit-0-0",
            "text": {
              "tr": "Halkaların iç kenarını ölç",
              "en": "Measure the inner edge of the rings",
              "de": "Vermesse die Innenkante der Ringe",
              "es": "Mide el borde interior de los anillos",
              "fr": "Mesure le bord intérieur des anneaux"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "planets-orbit-0-1",
            "text": {
              "tr": "İstasyonun haritasını izle",
              "en": "Follow the station’s chart",
              "de": "Folge der Stationskarte",
              "es": "Sigue el mapa de la estación",
              "fr": "Suis la carte de la station"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "planets-orbit-1",
        "seconds": 240,
        "choices": [
          {
            "id": "planets-orbit-1-0",
            "text": {
              "tr": "Uydu enkazından kayıt kurtar",
              "en": "Recover logs from satellite debris",
              "de": "Berge Aufzeichnungen aus Satellitentrümmern",
              "es": "Recupera registros de restos de satélite",
              "fr": "Récupère les archives du satellite"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "planets-orbit-1-1",
            "text": {
              "tr": "Yeni bir yörünge işareti yerleştir",
              "en": "Place a new orbital marker",
              "de": "Setze eine neue Orbitalmarkierung",
              "es": "Coloca una nueva marca orbital",
              "fr": "Place une nouvelle balise orbitale"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "planets-orbit-2",
        "seconds": 240
      }
    ],
    "clueId": "planets-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "nebula-scan",
    "worldId": "nebula",
    "name": {
      "tr": "Sis İçindeki İz",
      "en": "Trace in the Mist",
      "de": "Spur im Nebel",
      "es": "Rastro en la Niebla",
      "fr": "Trace dans la Brume"
    },
    "index": 0,
    "nodes": [
      {
        "id": "nebula-scan-0",
        "seconds": 300,
        "choices": [
          {
            "id": "nebula-scan-0-0",
            "text": {
              "tr": "Yoğun sisi derin tara",
              "en": "Scan deep into the dense mist",
              "de": "Scanne tief in den dichten Nebel",
              "es": "Escanea la niebla profunda",
              "fr": "Scanne au fond de la brume"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "nebula-scan-0-1",
            "text": {
              "tr": "İşaretli ışıklarda kal",
              "en": "Stay with the marked lights",
              "de": "Bleib bei den markierten Lichtern",
              "es": "Sigue las luces marcadas",
              "fr": "Reste près des lumières balisées"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "nebula-scan-1",
        "seconds": 240,
        "choices": [
          {
            "id": "nebula-scan-1-0",
            "text": {
              "tr": "Yankının kaynağına dön",
              "en": "Turn toward the echo source",
              "de": "Wende dich zur Echoquelle",
              "es": "Gira hacia el origen del eco",
              "fr": "Tourne vers la source de l’écho"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "nebula-scan-1-1",
            "text": {
              "tr": "Tarama rölesi bırak",
              "en": "Leave a scanning relay",
              "de": "Setze ein Scanrelais aus",
              "es": "Deja un relé de escaneo",
              "fr": "Laisse un relais de scan"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "nebula-scan-2",
        "seconds": 240
      }
    ],
    "clueId": "nebula-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "nebula-echo",
    "worldId": "nebula",
    "name": {
      "tr": "Yankı Haritası",
      "en": "Echo Map",
      "de": "Echokarte",
      "es": "Mapa de Ecos",
      "fr": "Carte des Échos"
    },
    "index": 1,
    "nodes": [
      {
        "id": "nebula-echo-0",
        "seconds": 300,
        "choices": [
          {
            "id": "nebula-echo-0-0",
            "text": {
              "tr": "Yankıları ayrı frekanslara böl",
              "en": "Split the echoes into frequencies",
              "de": "Teile Echos nach Frequenzen",
              "es": "Separa los ecos por frecuencias",
              "fr": "Sépare les échos par fréquences"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "nebula-echo-0-1",
            "text": {
              "tr": "Tanıdık frekansın izinde kal",
              "en": "Stay with the familiar frequency",
              "de": "Folge der vertrauten Frequenz",
              "es": "Sigue la frecuencia conocida",
              "fr": "Suis la fréquence familière"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "nebula-echo-1",
        "seconds": 240,
        "choices": [
          {
            "id": "nebula-echo-1-0",
            "text": {
              "tr": "Çifte yankının kaynağını tara",
              "en": "Scan the source of the double echo",
              "de": "Scanne die Quelle des Doppelechos",
              "es": "Escanea el origen del doble eco",
              "fr": "Scanne la source du double écho"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "nebula-echo-1-1",
            "text": {
              "tr": "Yankı zamanlarını röleye kaydet",
              "en": "Record echo timings at the relay",
              "de": "Speichere Echozeiten am Relais",
              "es": "Registra los tiempos en el relé",
              "fr": "Consigne les délais au relais"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "nebula-echo-2",
        "seconds": 240
      }
    ],
    "clueId": "nebula-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "nebula-lantern",
    "worldId": "nebula",
    "name": {
      "tr": "Nebula Feneri",
      "en": "Nebula Lantern",
      "de": "Nebellaterne",
      "es": "Faro de la Nebulosa",
      "fr": "Lanterne de la Nébuleuse"
    },
    "index": 2,
    "nodes": [
      {
        "id": "nebula-lantern-0",
        "seconds": 300,
        "choices": [
          {
            "id": "nebula-lantern-0-0",
            "text": {
              "tr": "Sönmüş fenerin merceğini temizle",
              "en": "Clean the dark lantern’s lens",
              "de": "Reinige die dunkle Laternenlinse",
              "es": "Limpia la lente apagada",
              "fr": "Nettoie la lentille éteinte"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "nebula-lantern-0-1",
            "text": {
              "tr": "Feneri yedek ışıkla işaretle",
              "en": "Mark the lantern with a backup light",
              "de": "Markiere die Laterne mit Ersatzlicht",
              "es": "Marca el faro con una luz auxiliar",
              "fr": "Marque la lanterne avec un feu de secours"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "nebula-lantern-1",
        "seconds": 240,
        "choices": [
          {
            "id": "nebula-lantern-1-0",
            "text": {
              "tr": "Işığı sisin merkezine yönelt",
              "en": "Aim the light into the mist’s centre",
              "de": "Richte Licht ins Nebelzentrum",
              "es": "Apunta la luz al centro de la niebla",
              "fr": "Dirige la lumière au centre de la brume"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "nebula-lantern-1-1",
            "text": {
              "tr": "Gelen gemiler için ışıklı hat kur",
              "en": "Build a light trail for arriving ships",
              "de": "Baue einen Lichtpfad für ankommende Schiffe",
              "es": "Traza luces para las naves que lleguen",
              "fr": "Trace un chemin lumineux pour les vaisseaux"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "nebula-lantern-2",
        "seconds": 240
      }
    ],
    "clueId": "nebula-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "deep-outpost",
    "worldId": "deep",
    "name": {
      "tr": "Son Tedarik",
      "en": "Last Supply",
      "de": "Letzte Versorgung",
      "es": "Último Suministro",
      "fr": "Dernier Ravitaillement"
    },
    "index": 0,
    "nodes": [
      {
        "id": "deep-outpost-0",
        "seconds": 300,
        "choices": [
          {
            "id": "deep-outpost-0-0",
            "text": {
              "tr": "Öncü sondayı gönder",
              "en": "Send the advance probe",
              "de": "Schicke die Vorhutsonde",
              "es": "Envía la sonda avanzada",
              "fr": "Envoie la sonde d’avant-garde"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "deep-outpost-0-1",
            "text": {
              "tr": "Tedarik noktasını güçlendir",
              "en": "Reinforce the supply outpost",
              "de": "Verstärke den Versorgungsposten",
              "es": "Refuerza el puesto de suministro",
              "fr": "Renforce le poste de ravitaillement"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "deep-outpost-1",
        "seconds": 240,
        "choices": [
          {
            "id": "deep-outpost-1-0",
            "text": {
              "tr": "Uzun geçişe hazırlan",
              "en": "Prepare for the long crossing",
              "de": "Bereite die lange Passage vor",
              "es": "Prepara el cruce largo",
              "fr": "Prépare la longue traversée"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "deep-outpost-1-1",
            "text": {
              "tr": "Güvenli geri dönüş hattı kur",
              "en": "Build a safe return link",
              "de": "Baue eine sichere Rückverbindung",
              "es": "Abre un enlace seguro de regreso",
              "fr": "Établis une liaison de retour sûre"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "deep-outpost-2",
        "seconds": 240
      }
    ],
    "clueId": "deep-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "deep-probe",
    "worldId": "deep",
    "name": {
      "tr": "Uzak Gözlemci",
      "en": "Distant Observer",
      "de": "Ferner Beobachter",
      "es": "Observador Lejano",
      "fr": "Observateur Lointain"
    },
    "index": 1,
    "nodes": [
      {
        "id": "deep-probe-0",
        "seconds": 300,
        "choices": [
          {
            "id": "deep-probe-0-0",
            "text": {
              "tr": "Sondanın son sinyaline yönel",
              "en": "Head toward the probe’s last signal",
              "de": "Folge dem letzten Sondensignal",
              "es": "Sigue la última señal de la sonda",
              "fr": "Suis le dernier signal de la sonde"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "deep-probe-0-1",
            "text": {
              "tr": "Geri dönüş rölesi bırakarak ilerle",
              "en": "Advance while leaving return relays",
              "de": "Setze auf dem Weg Rückkehrrelais",
              "es": "Avanza dejando relés de regreso",
              "fr": "Avance en laissant des relais de retour"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "deep-probe-1",
        "seconds": 240,
        "choices": [
          {
            "id": "deep-probe-1-0",
            "text": {
              "tr": "Sondanın keşif çekirdeğini kurtar",
              "en": "Recover the probe’s survey core",
              "de": "Berge den Erkundungskern",
              "es": "Recupera el núcleo de exploración",
              "fr": "Récupère le cœur d’exploration"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "deep-probe-1-1",
            "text": {
              "tr": "Yeni bir gözlem noktasına bağlan",
              "en": "Link to a new observation post",
              "de": "Verbinde dich mit einem neuen Beobachtungsposten",
              "es": "Conecta con un nuevo observatorio",
              "fr": "Relie un nouveau poste d’observation"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "deep-probe-2",
        "seconds": 240
      }
    ],
    "clueId": "deep-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "deep-gate",
    "worldId": "deep",
    "name": {
      "tr": "Uykudaki Geçit",
      "en": "Sleeping Gate",
      "de": "Schlafendes Tor",
      "es": "Portal Dormido",
      "fr": "Porte Endormie"
    },
    "index": 2,
    "nodes": [
      {
        "id": "deep-gate-0",
        "seconds": 300,
        "choices": [
          {
            "id": "deep-gate-0-0",
            "text": {
              "tr": "Geçidin soğuk çekirdeğini incele",
              "en": "Examine the gate’s cold core",
              "de": "Untersuche den kalten Torkern",
              "es": "Examina el núcleo frío del portal",
              "fr": "Examine le cœur froid de la porte"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "deep-gate-0-1",
            "text": {
              "tr": "Uzak bir yörüngeden ölçüm al",
              "en": "Measure from a distant orbit",
              "de": "Miss aus einer fernen Umlaufbahn",
              "es": "Mide desde una órbita lejana",
              "fr": "Mesure depuis une orbite lointaine"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "deep-gate-1",
        "seconds": 240,
        "choices": [
          {
            "id": "deep-gate-1-0",
            "text": {
              "tr": "Eski bağlantı işaretini uyandır",
              "en": "Wake the ancient link marker",
              "de": "Wecke das alte Verbindungszeichen",
              "es": "Despierta la antigua marca de enlace",
              "fr": "Réveille l’ancienne balise de liaison"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "deep-gate-1-1",
            "text": {
              "tr": "Dönüş koordinatlarını sabitle",
              "en": "Secure the return coordinates",
              "de": "Sichere die Rückkoordinaten",
              "es": "Asegura las coordenadas de regreso",
              "fr": "Sécurise les coordonnées de retour"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "deep-gate-2",
        "seconds": 240
      }
    ],
    "clueId": "deep-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "rim-signal",
    "worldId": "rim",
    "name": {
      "tr": "Kaynağı Bilinmeyen Sinyal",
      "en": "Unidentified Signal",
      "de": "Unbekanntes Signal",
      "es": "Señal Desconocida",
      "fr": "Signal Inconnu"
    },
    "index": 0,
    "nodes": [
      {
        "id": "rim-signal-0",
        "seconds": 900,
        "choices": [
          {
            "id": "rim-signal-0-0",
            "text": {
              "tr": "Sinyali yıldızlardan ayır",
              "en": "Separate the signal from the stars",
              "de": "Trenne das Signal von den Sternen",
              "es": "Separa la señal de las estrellas",
              "fr": "Sépare le signal des étoiles"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "rim-signal-0-1",
            "text": {
              "tr": "Son istasyona anten kur",
              "en": "Build an antenna at the last station",
              "de": "Baue eine Antenne an der letzten Station",
              "es": "Construye una antena en la última estación",
              "fr": "Construis une antenne à la dernière station"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "rim-signal-1",
        "seconds": 750,
        "choices": [
          {
            "id": "rim-signal-1-0",
            "text": {
              "tr": "Eski koordinatları karşılaştır",
              "en": "Compare the old coordinates",
              "de": "Vergleiche die alten Koordinaten",
              "es": "Compara las coordenadas antiguas",
              "fr": "Compare les anciennes coordonnées"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "rim-signal-1-1",
            "text": {
              "tr": "Karanlığa bir işaret bırak",
              "en": "Leave a beacon in the dark",
              "de": "Lass ein Leuchtzeichen im Dunkeln",
              "es": "Deja una baliza en la oscuridad",
              "fr": "Laisse une balise dans le noir"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "rim-signal-2",
        "seconds": 750
      }
    ],
    "clueId": "rim-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "rim-archive",
    "worldId": "rim",
    "name": {
      "tr": "Son Yıldızın Arşivi",
      "en": "Last Star Archive",
      "de": "Archiv des letzten Sterns",
      "es": "Archivo de la Última Estrella",
      "fr": "Archives de la Dernière Étoile"
    },
    "index": 1,
    "nodes": [
      {
        "id": "rim-archive-0",
        "seconds": 900,
        "choices": [
          {
            "id": "rim-archive-0-0",
            "text": {
              "tr": "Sönmekte olan yıldızın arşivini tara",
              "en": "Scan the fading star’s archive",
              "de": "Scanne das Archiv des verblassenden Sterns",
              "es": "Escanea el archivo de la estrella tenue",
              "fr": "Scanne les archives de l’étoile mourante"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "rim-archive-0-1",
            "text": {
              "tr": "Arşivin dış rölesinden kopya al",
              "en": "Copy the archive from the outer relay",
              "de": "Kopiere das Archiv am Außenrelais",
              "es": "Copia el archivo desde el relé exterior",
              "fr": "Copie les archives au relais extérieur"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "rim-archive-1",
        "seconds": 750,
        "choices": [
          {
            "id": "rim-archive-1-0",
            "text": {
              "tr": "Mesajın tekrar eden bölümünü çöz",
              "en": "Decode the repeating message segment",
              "de": "Entschlüssele den wiederholten Nachrichtenteil",
              "es": "Descifra el segmento repetido del mensaje",
              "fr": "Décode le segment répété du message"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "rim-archive-1-1",
            "text": {
              "tr": "Kayıtları güvenli kapsüle aktar",
              "en": "Transfer the records to a safe capsule",
              "de": "Übertrage die Aufzeichnungen in eine sichere Kapsel",
              "es": "Pasa los registros a una cápsula segura",
              "fr": "Transfère les archives dans une capsule sûre"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "rim-archive-2",
        "seconds": 750
      }
    ],
    "clueId": "rim-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "rim-bearing",
    "worldId": "rim",
    "name": {
      "tr": "Karanlığa Bir İşaret",
      "en": "Bearing into Darkness",
      "de": "Kurs in die Dunkelheit",
      "es": "Rumbo a la Oscuridad",
      "fr": "Cap vers l’Obscurité"
    },
    "index": 2,
    "nodes": [
      {
        "id": "rim-bearing-0",
        "seconds": 900,
        "choices": [
          {
            "id": "rim-bearing-0-0",
            "text": {
              "tr": "Sinyalin iki yönünü karşılaştır",
              "en": "Compare the signal’s two bearings",
              "de": "Vergleiche beide Signalrichtungen",
              "es": "Compara las dos direcciones de la señal",
              "fr": "Compare les deux directions du signal"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "rim-bearing-0-1",
            "text": {
              "tr": "Son yıldızdan referans ölç",
              "en": "Take a reference from the last star",
              "de": "Miss vom letzten Stern als Referenz",
              "es": "Toma la última estrella como referencia",
              "fr": "Prends la dernière étoile comme référence"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "rim-bearing-1",
        "seconds": 750,
        "choices": [
          {
            "id": "rim-bearing-1-0",
            "text": {
              "tr": "İlk boşluk fenerini yerleştir",
              "en": "Place the first void beacon",
              "de": "Setze das erste Leuchtfeuer in die Leere",
              "es": "Coloca la primera baliza del vacío",
              "fr": "Place la première balise du vide"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "rim-bearing-1-1",
            "text": {
              "tr": "Geçiş için enerji deposu bırak",
              "en": "Leave an energy cache for the crossing",
              "de": "Lass einen Energievorrat für die Passage",
              "es": "Deja energía para el cruce",
              "fr": "Laisse une réserve d’énergie pour la traversée"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "rim-bearing-2",
        "seconds": 750
      }
    ],
    "clueId": "rim-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "void-relay",
    "worldId": "void",
    "name": {
      "tr": "Sürüklenen Röle",
      "en": "Drifting Relay",
      "de": "Treibendes Relais",
      "es": "Relé a la Deriva",
      "fr": "Relais à la Dérive"
    },
    "index": 0,
    "nodes": [
      {
        "id": "void-relay-0",
        "seconds": 900,
        "choices": [
          {
            "id": "void-relay-0-0",
            "text": {
              "tr": "Röleyi sessizce uyandır",
              "en": "Wake the relay gently",
              "de": "Wecke das Relais behutsam",
              "es": "Despierta el relé con cuidado",
              "fr": "Réveille doucement le relais"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "void-relay-0-1",
            "text": {
              "tr": "Güç çekirdeğini değiştir",
              "en": "Replace its power core",
              "de": "Ersetze seinen Energiekern",
              "es": "Cambia su núcleo de energía",
              "fr": "Remplace son cœur d’énergie"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "void-relay-1",
        "seconds": 750,
        "choices": [
          {
            "id": "void-relay-1-0",
            "text": {
              "tr": "İstasyonun kayıtlarını kurtar",
              "en": "Recover the station logs",
              "de": "Berge die Stationsaufzeichnungen",
              "es": "Recupera los registros de la estación",
              "fr": "Récupère les archives de la station"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "void-relay-1-1",
            "text": {
              "tr": "Geçiş için korunak kur",
              "en": "Build a crossing shelter",
              "de": "Baue einen Schutz für die Passage",
              "es": "Construye un refugio para cruzar",
              "fr": "Construis un abri pour la traversée"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "void-relay-2",
        "seconds": 750
      }
    ],
    "clueId": "void-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "void-station",
    "worldId": "void",
    "name": {
      "tr": "Unutulmuş İstasyon",
      "en": "Forgotten Station",
      "de": "Vergessene Station",
      "es": "Estación Olvidada",
      "fr": "Station Oubliée"
    },
    "index": 1,
    "nodes": [
      {
        "id": "void-station-0",
        "seconds": 900,
        "choices": [
          {
            "id": "void-station-0-0",
            "text": {
              "tr": "İstasyonun basınç kapısını onar",
              "en": "Repair the station’s pressure door",
              "de": "Repariere die Druckschleuse",
              "es": "Repara la puerta de presión",
              "fr": "Répare le sas pressurisé"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "void-station-0-1",
            "text": {
              "tr": "Dış terminale yanaş",
              "en": "Dock at the external terminal",
              "de": "Docke am Außenterminal an",
              "es": "Atraca en la terminal exterior",
              "fr": "Accoste au terminal extérieur"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "void-station-1",
        "seconds": 750,
        "choices": [
          {
            "id": "void-station-1-0",
            "text": {
              "tr": "Yolcuların son defterini oku",
              "en": "Read the travelers’ final log",
              "de": "Lies das letzte Reisetagebuch",
              "es": "Lee el último diario de los viajeros",
              "fr": "Lis le dernier journal des voyageurs"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "void-station-1-1",
            "text": {
              "tr": "İstasyonu bir sığınağa dönüştür",
              "en": "Turn the station into a shelter",
              "de": "Baue die Station zum Schutzort um",
              "es": "Convierte la estación en refugio",
              "fr": "Transforme la station en abri"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "void-station-2",
        "seconds": 750
      }
    ],
    "clueId": "void-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "void-bridge",
    "worldId": "void",
    "name": {
      "tr": "İlk Köprü",
      "en": "First Bridge",
      "de": "Erste Brücke",
      "es": "Primer Puente",
      "fr": "Premier Pont"
    },
    "index": 2,
    "nodes": [
      {
        "id": "void-bridge-0",
        "seconds": 900,
        "choices": [
          {
            "id": "void-bridge-0-0",
            "text": {
              "tr": "İki rölenin saatini eşleştir",
              "en": "Synchronize the two relays",
              "de": "Synchronisiere beide Relais",
              "es": "Sincroniza ambos relés",
              "fr": "Synchronise les deux relais"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "void-bridge-0-1",
            "text": {
              "tr": "Kararlı röle üzerinden bağlan",
              "en": "Connect through the stable relay",
              "de": "Verbinde über das stabile Relais",
              "es": "Conecta mediante el relé estable",
              "fr": "Relie via le relais stable"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "void-bridge-1",
        "seconds": 750,
        "choices": [
          {
            "id": "void-bridge-1-0",
            "text": {
              "tr": "Karanlığın ötesine bağlantı kur",
              "en": "Establish a link beyond the dark",
              "de": "Baue eine Verbindung jenseits der Dunkelheit",
              "es": "Abre un enlace más allá de la oscuridad",
              "fr": "Établis une liaison au-delà du noir"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "void-bridge-1-1",
            "text": {
              "tr": "Köprünün dönüş ucunu güçlendir",
              "en": "Reinforce the bridge’s return end",
              "de": "Verstärke die Rückseite der Brücke",
              "es": "Refuerza el extremo de regreso",
              "fr": "Renforce l’extrémité de retour du pont"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "void-bridge-2",
        "seconds": 750
      }
    ],
    "clueId": "void-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "galaxies-chart",
    "worldId": "galaxies",
    "name": {
      "tr": "Spiral Atlas",
      "en": "Spiral Atlas",
      "de": "Spiralatlas",
      "es": "Atlas Espiral",
      "fr": "Atlas Spiral"
    },
    "index": 0,
    "nodes": [
      {
        "id": "galaxies-chart-0",
        "seconds": 900,
        "choices": [
          {
            "id": "galaxies-chart-0-0",
            "text": {
              "tr": "Spiral kolları haritala",
              "en": "Chart the spiral arms",
              "de": "Kartiere die Spiralarme",
              "es": "Cartografía los brazos espirales",
              "fr": "Cartographie les bras spiraux"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "galaxies-chart-0-1",
            "text": {
              "tr": "İki galaksi arasında hat aç",
              "en": "Open a link between two galaxies",
              "de": "Öffne eine Verbindung zwischen Galaxien",
              "es": "Abre un enlace entre galaxias",
              "fr": "Ouvre une liaison entre galaxies"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "galaxies-chart-1",
        "seconds": 750,
        "choices": [
          {
            "id": "galaxies-chart-1-0",
            "text": {
              "tr": "Kılavuz gemiyi öne gönder",
              "en": "Send the guide ship ahead",
              "de": "Schicke das Lotsenschiff voraus",
              "es": "Envía delante la nave guía",
              "fr": "Envoie le vaisseau guide devant"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "galaxies-chart-1-1",
            "text": {
              "tr": "Filoya ortak ikmal kur",
              "en": "Set up shared fleet supplies",
              "de": "Richte gemeinsame Flottenversorgung ein",
              "es": "Prepara suministros compartidos",
              "fr": "Organise le ravitaillement commun"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "galaxies-chart-2",
        "seconds": 750
      }
    ],
    "clueId": "galaxies-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "galaxies-fleet",
    "worldId": "galaxies",
    "name": {
      "tr": "Üç Ayrı Ufuk",
      "en": "Three Horizons",
      "de": "Drei Horizonte",
      "es": "Tres Horizontes",
      "fr": "Trois Horizons"
    },
    "index": 1,
    "nodes": [
      {
        "id": "galaxies-fleet-0",
        "seconds": 900,
        "choices": [
          {
            "id": "galaxies-fleet-0-0",
            "text": {
              "tr": "Öncü gemiye keşif rotası ver",
              "en": "Assign a survey route to the lead ship",
              "de": "Weise dem Führungsschiff eine Erkundungsroute zu",
              "es": "Asigna una ruta de exploración a la nave líder",
              "fr": "Assigne une route au vaisseau de tête"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "galaxies-fleet-0-1",
            "text": {
              "tr": "Gemileri ortak limanda hazırla",
              "en": "Prepare the ships at the shared harbour",
              "de": "Bereite die Schiffe am gemeinsamen Hafen vor",
              "es": "Prepara las naves en el puerto común",
              "fr": "Prépare les vaisseaux au port commun"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "galaxies-fleet-1",
        "seconds": 750,
        "choices": [
          {
            "id": "galaxies-fleet-1-0",
            "text": {
              "tr": "Üç görev için buluşma noktası seç",
              "en": "Choose a rendezvous for three missions",
              "de": "Wähle einen Treffpunkt für drei Missionen",
              "es": "Elige un punto de reunión para tres misiones",
              "fr": "Choisis un rendez-vous pour trois missions"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "galaxies-fleet-1-1",
            "text": {
              "tr": "Yük gemisine güvenli hat çiz",
              "en": "Chart a safe route for the cargo ship",
              "de": "Kartiere eine sichere Frachtroute",
              "es": "Traza una ruta segura de carga",
              "fr": "Trace une route sûre pour le cargo"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "galaxies-fleet-2",
        "seconds": 750
      }
    ],
    "clueId": "galaxies-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "galaxies-network",
    "worldId": "galaxies",
    "name": {
      "tr": "Yıldızların Örgüsü",
      "en": "Weave of Stars",
      "de": "Sternengeflecht",
      "es": "Trama de Estrellas",
      "fr": "Trame des Étoiles"
    },
    "index": 2,
    "nodes": [
      {
        "id": "galaxies-network-0",
        "seconds": 900,
        "choices": [
          {
            "id": "galaxies-network-0-0",
            "text": {
              "tr": "Kopuk galaksi bağını araştır",
              "en": "Survey the broken galactic link",
              "de": "Erkunde die unterbrochene Galaxienverbindung",
              "es": "Explora el enlace galáctico roto",
              "fr": "Explore la liaison galactique rompue"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "galaxies-network-0-1",
            "text": {
              "tr": "Çalışan düğümlerden dolaş",
              "en": "Travel through functioning nodes",
              "de": "Nutze funktionierende Knoten",
              "es": "Viaja por los nodos activos",
              "fr": "Passe par les nœuds actifs"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "galaxies-network-1",
        "seconds": 750,
        "choices": [
          {
            "id": "galaxies-network-1-0",
            "text": {
              "tr": "Atlasın merkez düğümünü aç",
              "en": "Open the atlas’s central node",
              "de": "Öffne den Zentralknoten des Atlas",
              "es": "Abre el nodo central del atlas",
              "fr": "Ouvre le nœud central de l’atlas"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "galaxies-network-1-1",
            "text": {
              "tr": "Ağın ikmal kapasitesini artır",
              "en": "Increase the network’s supply capacity",
              "de": "Erhöhe die Versorgung des Netzes",
              "es": "Amplía el suministro de la red",
              "fr": "Augmente le ravitaillement du réseau"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "galaxies-network-2",
        "seconds": 750
      }
    ],
    "clueId": "galaxies-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "fracture-clock",
    "worldId": "fracture",
    "name": {
      "tr": "Geri Akan Saat",
      "en": "Backward Clock",
      "de": "Rückwärtsuhr",
      "es": "Reloj Inverso",
      "fr": "Horloge Inversée"
    },
    "index": 0,
    "nodes": [
      {
        "id": "fracture-clock-0",
        "seconds": 900,
        "choices": [
          {
            "id": "fracture-clock-0-0",
            "text": {
              "tr": "Zaman farkını ölç",
              "en": "Measure the time drift",
              "de": "Miss die Zeitabweichung",
              "es": "Mide el desfase temporal",
              "fr": "Mesure le décalage temporel"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "fracture-clock-0-1",
            "text": {
              "tr": "Kararlı dış yolu kullan",
              "en": "Use the stable outer route",
              "de": "Nutze den stabilen Außenweg",
              "es": "Usa la ruta exterior estable",
              "fr": "Suis la route extérieure stable"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "fracture-clock-1",
        "seconds": 750,
        "choices": [
          {
            "id": "fracture-clock-1-0",
            "text": {
              "tr": "Geçidin dengesini onar",
              "en": "Repair the gate’s balance",
              "de": "Repariere das Gleichgewicht des Tors",
              "es": "Repara el equilibrio del portal",
              "fr": "Répare l’équilibre de la porte"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "fracture-clock-1-1",
            "text": {
              "tr": "Katlanmış koordinatları çöz",
              "en": "Decode the folded coordinates",
              "de": "Entschlüssle die gefalteten Koordinaten",
              "es": "Descifra las coordenadas plegadas",
              "fr": "Décode les coordonnées repliées"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "fracture-clock-2",
        "seconds": 750
      }
    ],
    "clueId": "fracture-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "fracture-fold",
    "worldId": "fracture",
    "name": {
      "tr": "Katlanmış Yol",
      "en": "Folded Road",
      "de": "Gefalteter Weg",
      "es": "Camino Plegado",
      "fr": "Route Repliée"
    },
    "index": 1,
    "nodes": [
      {
        "id": "fracture-fold-0",
        "seconds": 900,
        "choices": [
          {
            "id": "fracture-fold-0-0",
            "text": {
              "tr": "Katlanmış koordinatları eşleştir",
              "en": "Match the folded coordinates",
              "de": "Ordne die gefalteten Koordinaten zu",
              "es": "Relaciona las coordenadas plegadas",
              "fr": "Associe les coordonnées repliées"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "fracture-fold-0-1",
            "text": {
              "tr": "İşaretlenmiş düz yolda kal",
              "en": "Stay on the marked straight route",
              "de": "Bleib auf dem markierten geraden Weg",
              "es": "Sigue la ruta recta marcada",
              "fr": "Reste sur la route droite balisée"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "fracture-fold-1",
        "seconds": 750,
        "choices": [
          {
            "id": "fracture-fold-1-0",
            "text": {
              "tr": "Mekânın iki ucunu birleştir",
              "en": "Join the two ends of space",
              "de": "Verbinde beide Enden des Raums",
              "es": "Une los extremos del espacio",
              "fr": "Relie les deux bouts de l’espace"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "fracture-fold-1-1",
            "text": {
              "tr": "Dönüş işaretini kıvrımın dışına koy",
              "en": "Place the return beacon outside the fold",
              "de": "Setze das Rückkehrzeichen außerhalb der Falte",
              "es": "Deja la baliza fuera del pliegue",
              "fr": "Place la balise hors du pli"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "fracture-fold-2",
        "seconds": 750
      }
    ],
    "clueId": "fracture-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "fracture-repair",
    "worldId": "fracture",
    "name": {
      "tr": "Kırık Geçit",
      "en": "Broken Gate",
      "de": "Gebrochenes Tor",
      "es": "Portal Roto",
      "fr": "Porte Brisée"
    },
    "index": 2,
    "nodes": [
      {
        "id": "fracture-repair-0",
        "seconds": 900,
        "choices": [
          {
            "id": "fracture-repair-0-0",
            "text": {
              "tr": "Geçidin dengesiz halkasını ölç",
              "en": "Measure the gate’s unstable ring",
              "de": "Miss den instabilen Torring",
              "es": "Mide el anillo inestable",
              "fr": "Mesure l’anneau instable"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "fracture-repair-0-1",
            "text": {
              "tr": "Dış halkayı geçici destekle tut",
              "en": "Brace the outer ring temporarily",
              "de": "Stütze den Außenring vorübergehend",
              "es": "Sujeta temporalmente el anillo exterior",
              "fr": "Étaye temporairement l’anneau extérieur"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "fracture-repair-1",
        "seconds": 750,
        "choices": [
          {
            "id": "fracture-repair-1-0",
            "text": {
              "tr": "Kırık çekirdeği yeniden hizala",
              "en": "Realign the broken core",
              "de": "Richte den gebrochenen Kern neu aus",
              "es": "Realinea el núcleo roto",
              "fr": "Réaligne le cœur brisé"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "fracture-repair-1-1",
            "text": {
              "tr": "Onarımı iki güvenli geçişe böl",
              "en": "Split the repair into two safe crossings",
              "de": "Teile die Reparatur in zwei sichere Passagen",
              "es": "Divide la reparación en dos cruces seguros",
              "fr": "Divise la réparation en deux passages sûrs"
            },
            "ability": "explore",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "fracture-repair-2",
        "seconds": 750
      }
    ],
    "clueId": "fracture-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "frontier-origin",
    "worldId": "frontier",
    "name": {
      "tr": "İlk Sesin Kaynağı",
      "en": "Source of the First Voice",
      "de": "Quelle der ersten Stimme",
      "es": "Origen de la Primera Voz",
      "fr": "Source de la Première Voix"
    },
    "index": 0,
    "nodes": [
      {
        "id": "frontier-origin-0",
        "seconds": 900,
        "choices": [
          {
            "id": "frontier-origin-0-0",
            "text": {
              "tr": "İlk mesajı yeniden birleştir",
              "en": "Reconstruct the first message",
              "de": "Setze die erste Nachricht zusammen",
              "es": "Reconstruye el primer mensaje",
              "fr": "Reconstitue le premier message"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-origin-0-1",
            "text": {
              "tr": "Geçidin enerji izini takip et",
              "en": "Follow the gate’s energy trace",
              "de": "Folge der Energiespur des Tors",
              "es": "Sigue el rastro energético del portal",
              "fr": "Suis la trace d’énergie de la porte"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-origin-1",
        "seconds": 750,
        "choices": [
          {
            "id": "frontier-origin-1-0",
            "text": {
              "tr": "Yeni sistemin göğünü haritala",
              "en": "Chart the new system’s sky",
              "de": "Kartiere den Himmel des neuen Systems",
              "es": "Cartografía el cielo del nuevo sistema",
              "fr": "Cartographie le ciel du nouveau système"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-origin-1-1",
            "text": {
              "tr": "Dönecek gezginler için liman kur",
              "en": "Build a harbour for returning travelers",
              "de": "Baue einen Hafen für Heimkehrende",
              "es": "Construye un puerto para regresar",
              "fr": "Construis un port pour les retours"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-origin-2",
        "seconds": 750
      }
    ],
    "clueId": "frontier-0",
    "research": 3,
    "specialty": "explore"
  },
  {
    "id": "frontier-answer",
    "worldId": "frontier",
    "name": {
      "tr": "Geçit Bekçisinin Mektubu",
      "en": "Gatekeeper’s Letter",
      "de": "Brief des Torwächters",
      "es": "Carta del Guardián",
      "fr": "Lettre du Gardien"
    },
    "index": 1,
    "nodes": [
      {
        "id": "frontier-answer-0",
        "seconds": 900,
        "choices": [
          {
            "id": "frontier-answer-0-0",
            "text": {
              "tr": "Bekçinin mektubunu yeniden birleştir",
              "en": "Reassemble the gatekeeper’s letter",
              "de": "Setze den Brief des Wächters zusammen",
              "es": "Reconstruye la carta del guardián",
              "fr": "Reconstitue la lettre du gardien"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-answer-0-1",
            "text": {
              "tr": "Mektubun sağlam kopyasını koru",
              "en": "Preserve the intact copy of the letter",
              "de": "Bewahre die intakte Briefkopie",
              "es": "Conserva la copia intacta",
              "fr": "Conserve la copie intacte"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-answer-1",
        "seconds": 750,
        "choices": [
          {
            "id": "frontier-answer-1-0",
            "text": {
              "tr": "Mesajın son koordinatını çöz",
              "en": "Decode the message’s final coordinate",
              "de": "Entschlüssle die letzte Koordinate",
              "es": "Descifra la coordenada final",
              "fr": "Décode la dernière coordonnée"
            },
            "ability": "endurance",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-answer-1-1",
            "text": {
              "tr": "Bekçinin dönüş rotasını işaretle",
              "en": "Mark the gatekeeper’s return route",
              "de": "Markiere den Rückweg des Wächters",
              "es": "Marca el regreso del guardián",
              "fr": "Marque le retour du gardien"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-answer-2",
        "seconds": 750
      }
    ],
    "clueId": "frontier-1",
    "research": 3,
    "specialty": "cargo"
  },
  {
    "id": "frontier-dawn",
    "worldId": "frontier",
    "name": {
      "tr": "Yeni Bir Gökyüzü",
      "en": "A New Sky",
      "de": "Ein neuer Himmel",
      "es": "Un Cielo Nuevo",
      "fr": "Un Nouveau Ciel"
    },
    "index": 2,
    "nodes": [
      {
        "id": "frontier-dawn-0",
        "seconds": 900,
        "choices": [
          {
            "id": "frontier-dawn-0-0",
            "text": {
              "tr": "Yeni sistemin ilk gezegenini haritala",
              "en": "Chart the new system’s first planet",
              "de": "Kartiere den ersten Planeten des Systems",
              "es": "Cartografía el primer planeta",
              "fr": "Cartographie la première planète"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-dawn-0-1",
            "text": {
              "tr": "Giriş limanını güvene al",
              "en": "Secure the arrival harbour",
              "de": "Sichere den Ankunftshafen",
              "es": "Asegura el puerto de llegada",
              "fr": "Sécurise le port d’arrivée"
            },
            "ability": "range",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-dawn-1",
        "seconds": 750,
        "choices": [
          {
            "id": "frontier-dawn-1-0",
            "text": {
              "tr": "Yeni göğün ilk fenerini yak",
              "en": "Light the first beacon of the new sky",
              "de": "Entzünde das erste Leuchtfeuer des neuen Himmels",
              "es": "Enciende la primera baliza del nuevo cielo",
              "fr": "Allume la première balise du nouveau ciel"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-dawn-1-1",
            "text": {
              "tr": "Gelecek yolculara kamp kur",
              "en": "Build a camp for future travelers",
              "de": "Baue ein Lager für künftige Reisende",
              "es": "Construye un campamento para futuros viajeros",
              "fr": "Installe un camp pour les futurs voyageurs"
            },
            "ability": "cargo",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-dawn-2",
        "seconds": 750
      }
    ],
    "clueId": "frontier-2",
    "research": 3,
    "specialty": "range"
  },
  {
    "id": "frontier-ocean",
    "worldId": "frontier",
    "name": {
      "tr": "İlk Mavi Dünya",
      "en": "First Blue World",
      "de": "Erste blaue Welt",
      "es": "Primer Mundo Azul",
      "fr": "Premier Monde Bleu"
    },
    "index": 3,
    "nodes": [
      {
        "id": "frontier-ocean-0",
        "seconds": 900,
        "choices": [
          {
            "id": "frontier-ocean-0-0",
            "text": {
              "tr": "Okyanusun kıyısını tara",
              "en": "Scan the ocean coast",
              "de": "Scanne die Ozeanküste",
              "es": "Escanea la costa oceánica",
              "fr": "Scanne la côte océanique"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-ocean-0-1",
            "text": {
              "tr": "Yörüngeden güvenli harita çıkar",
              "en": "Map safely from orbit",
              "de": "Kartiere sicher aus dem Orbit",
              "es": "Cartografía desde la órbita",
              "fr": "Cartographie depuis l’orbite"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-ocean-1",
        "seconds": 750,
        "choices": [
          {
            "id": "frontier-ocean-1-0",
            "text": {
              "tr": "Adalardaki işaretleri incele",
              "en": "Examine the island markers",
              "de": "Untersuche die Inselzeichen",
              "es": "Examina las marcas de las islas",
              "fr": "Examine les balises des îles"
            },
            "ability": "explore",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-ocean-1-1",
            "text": {
              "tr": "Dönüş fenerini kıyıya kur",
              "en": "Build a coastal return beacon",
              "de": "Baue ein Rückkehrfeuer an der Küste",
              "es": "Construye una baliza costera",
              "fr": "Installe une balise de retour côtière"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-ocean-2",
        "seconds": 750
      }
    ],
    "clueId": "frontier-3",
    "research": 3,
    "specialty": "explore",
    "requires": [
      "frontier-dawn"
    ]
  },
  {
    "id": "frontier-harbour",
    "worldId": "frontier",
    "name": {
      "tr": "Yolcuların Yeni Limanı",
      "en": "New Travelers’ Harbour",
      "de": "Neuer Reisehafen",
      "es": "Nuevo Puerto de Viajeros",
      "fr": "Nouveau Port des Voyageurs"
    },
    "index": 4,
    "nodes": [
      {
        "id": "frontier-harbour-0",
        "seconds": 900,
        "choices": [
          {
            "id": "frontier-harbour-0-0",
            "text": {
              "tr": "İskele malzemelerini taşı",
              "en": "Deliver dock materials",
              "de": "Liefere Stegmaterial",
              "es": "Entrega materiales para el muelle",
              "fr": "Livre les matériaux du quai"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-harbour-0-1",
            "text": {
              "tr": "İlk gemileri korunaklı koya yönelt",
              "en": "Guide ships into the sheltered bay",
              "de": "Leite Schiffe in die geschützte Bucht",
              "es": "Guía las naves a la bahía protegida",
              "fr": "Guide les vaisseaux dans la baie abritée"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-harbour-1",
        "seconds": 750,
        "choices": [
          {
            "id": "frontier-harbour-1-0",
            "text": {
              "tr": "Limanın rüzgâr kulesini kur",
              "en": "Build the harbour wind tower",
              "de": "Baue den Windturm des Hafens",
              "es": "Construye la torre de viento",
              "fr": "Construis la tour du vent du port"
            },
            "ability": "cargo",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-harbour-1-1",
            "text": {
              "tr": "Tedarik iskelesini güçlendir",
              "en": "Reinforce the supply dock",
              "de": "Verstärke den Versorgungssteg",
              "es": "Refuerza el muelle de suministro",
              "fr": "Renforce le quai de ravitaillement"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-harbour-2",
        "seconds": 750
      }
    ],
    "clueId": "frontier-4",
    "research": 3,
    "specialty": "explore",
    "requires": [
      "frontier-dawn"
    ]
  },
  {
    "id": "frontier-archive",
    "worldId": "frontier",
    "name": {
      "tr": "Geleceğin Atlası",
      "en": "Atlas of Tomorrow",
      "de": "Atlas von morgen",
      "es": "Atlas del Mañana",
      "fr": "Atlas de Demain"
    },
    "index": 5,
    "nodes": [
      {
        "id": "frontier-archive-0",
        "seconds": 900,
        "choices": [
          {
            "id": "frontier-archive-0-0",
            "text": {
              "tr": "Üç keşif hattının kayıtlarını birleştir",
              "en": "Combine the three survey logs",
              "de": "Verbinde die drei Erkundungsberichte",
              "es": "Une los tres registros de exploración",
              "fr": "Réunis les trois relevés d’exploration"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-archive-0-1",
            "text": {
              "tr": "Sağlam kayıtları limanda çoğalt",
              "en": "Copy intact records at the harbour",
              "de": "Kopiere intakte Berichte im Hafen",
              "es": "Copia los registros intactos en el puerto",
              "fr": "Copie les relevés intacts au port"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-archive-1",
        "seconds": 750,
        "choices": [
          {
            "id": "frontier-archive-1-0",
            "text": {
              "tr": "Yeni yıldızların rotalarını çöz",
              "en": "Decode the new star routes",
              "de": "Entschlüssle die neuen Sternrouten",
              "es": "Descifra las nuevas rutas estelares",
              "fr": "Décode les nouvelles routes stellaires"
            },
            "ability": "range",
            "safe": false,
            "reveal": true,
            "energy": 1
          },
          {
            "id": "frontier-archive-1-1",
            "text": {
              "tr": "Atlası sonraki gezginlere bırak",
              "en": "Leave the atlas for future travelers",
              "de": "Hinterlasse den Atlas für kommende Reisende",
              "es": "Deja el atlas a futuros viajeros",
              "fr": "Laisse l’atlas aux futurs voyageurs"
            },
            "ability": "endurance",
            "safe": true,
            "reveal": false,
            "energy": 0
          }
        ]
      },
      {
        "id": "frontier-archive-2",
        "seconds": 750
      }
    ],
    "clueId": "frontier-5",
    "research": 3,
    "specialty": "explore",
    "requires": [
      "frontier-dawn"
    ]
  }
];
const FAMILIES={
 walk:[4,1,3,1],skates:[3,1,2,3],board:[3,1,2,4],bike:[4,2,3,3],horse:[3,2,5,2],moto:[3,2,2,5],car:[2,4,3,3],van:[2,5,4,2],train:[2,5,5,2],balloon:[5,2,2,3],plane:[3,3,3,5],jet:[2,2,3,5],rocket:[3,3,4,5],sail:[5,3,2,4],comet:[4,1,3,5],warp:[3,3,4,5],whale:[4,4,5,3],startrain:[2,5,5,4],anka:[5,2,4,4],chrono:[5,2,3,4],portal:[4,2,4,5],cosmos:[5,4,3,4]
};
const VEHICLE_ROLES=Object.fromEntries(Object.entries(FAMILIES).map(([id,a])=>[id,Object.fromEntries(['explore','cargo','endurance','range'].map((k,i)=>[k,a[i]]))]));
const WORLD=Object.fromEntries(WORLDS.map(w=>[w.id,w])), TEMPLATE=Object.fromEntries(TEMPLATES.map(t=>[t.id,t]));
const n=x=>typeof x==='number'&&Number.isFinite(x)&&x>0?x:0;
function eligibility(save){
 const ids=['earth'], owned=save.owned||{}, all=IT.VEHICLES||[];
 const beyond=id=>all.slice(all.findIndex(v=>v.id===id)).some(v=>owned[v.id]);
 if(beyond('balloon')) ids.push('cloud'); if(beyond('rocket')) ids.push('planets');
 if(Math.max(n(save.distance),n(save.lifeDist),n(save.legacyDist))>=100000*IT.LY) ids.push('rim');
 return ids;
}
function availableTemplates(state,worldId){return TEMPLATES.filter(t=>t.worldId===worldId&&(!t.requires||t.requires.every(id=>state.claimedRewards.includes(id))));}
function availableEntries(save){return [...new Set([...eligibility(save),...(save.v2?.unlockedWorlds||[]).filter(id=>WORLD[id])])];}
function text(value){if(typeof value==='string')return value;const lang=IT.lang?IT.lang():'tr';return value?.[lang]||value?.en||'';}
Object.assign(V,{WORLDS,WORLD,TEMPLATES,TEMPLATE,VEHICLE_ROLES,availableTemplates,eligibility,availableEntries,text,n});
})(typeof window!=='undefined'?window:globalThis);
