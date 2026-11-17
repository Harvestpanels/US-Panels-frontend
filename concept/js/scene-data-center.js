/* Data center scene for js/building.js: two pictures (outside, inside) and a pin on every part.
   The pictures are AI-made illustrations of a typical data center, not photos of a US Panels job (the page says so). Replace them with real job photos when available:
   keep the same file names, or change `images`, then re-place the pins (x and y are percent of the picture).
   Product words, pictures and the pick-list come from the cards on data-centers.html; the rows in `info` come from the live US Panels product copy,
   and from the nominal door / trim data already used in the 3D showroom. */
(function(){
  const U=window.USPB=window.USPB||{scenes:{}};
  const CALL='Thickness, weight and test data: call (405) 778-2808.';
  U.scenes['data-center']={
    modes:{
      out:{label:'Outside',title:'The outside',lead:'The roof, the walls, the entrance door and the corner trim. Tap a number on the picture, or pick a part here.'},
      in:{label:'Inside',title:'The inside',lead:'The ceiling, the interior wall, seam trim, a door and a corner. Tap a number on the picture, or pick a part here.'}
    },
    images:{
      out:{src:'img/dc-outside.jpg',w:2200,h:1244,alt:'Illustration of a data center from outside: a white insulated metal panel building with a smooth front wall, a side wall with visible fasteners, a ribbed roof, an entrance door and aluminum corner trim.'},
      in:{src:'img/dc-inside.jpg',w:2200,h:1244,alt:'Illustration of the inside of a data center hall: server racks, a perforated white ceiling and wall, and a grey metal door.'}
    },
    parts:[
      {key:'roof',pid:'roof-fireguard',mode:'out',n:1,label:'Roof',x:58.3,y:21.6,look:'The long ribs running down the roof.'},
      {key:'wall-front',pid:'wall-hidden',mode:'out',n:2,label:'Front wall',x:27.2,y:41.2,look:'A smooth face with only hairline joints and no fasteners showing.'},
      {key:'wall-side',pid:'wall-exposed',mode:'out',n:3,label:'Side wall',x:71.8,y:48.1,look:'The round fastener heads in rows across each panel.'},
      {key:'door-out',pid:'metal-doors',mode:'out',n:4,label:'Entrance door',x:31.7,y:73.8,look:'The grey door in its aluminum frame.'},
      {key:'corner-out',pid:'corner-angles',mode:'out',n:5,label:'Corner trim',x:61.7,y:58.4,look:'The slim aluminum angle where the two walls meet.'},
      {key:'ceiling',pid:'roof-acoustic',mode:'in',n:1,label:'Ceiling',x:38.8,y:20.6,look:'The fine perforations across the white ceiling.'},
      {key:'partition',pid:'interior-acoustic',mode:'in',n:2,label:'Interior wall',x:45.4,y:58.4,look:'The perforated white wall at the end of the aisle.'},
      {key:'tbar',pid:'t-bar',mode:'in',n:3,label:'Seam trim',x:50.4,y:22.7,look:'The slim aluminum lines where ceiling panels meet.'},
      {key:'door-in',pid:'metal-doors',mode:'in',n:4,label:'Interior door',x:59.6,y:60.4,look:'The grey door set in the perforated wall.'},
      {key:'corner-in',pid:'corner-angles',mode:'in',n:5,label:'Corner trim',x:68.9,y:58.4,look:'The aluminum angle in the inside corner.'}
    ],
    info:{
      'roof-fireguard':{showroom:'showroom.html#fireguard/roof-fireguard',note:CALL,
        specs:[['Core','Mineral rockwool'],['Roof type','Self-supporting, rated for low slope'],['Outer face','External ribbed steel sheet']]},
      'roof-acoustic':{showroom:'showroom.html#fireguard/roof-acoustic',note:CALL,
        specs:[['Core','Mineral rockwool'],['Roof type','Self-supporting'],['Joint','Tongue-and-groove'],['Inside face','Micro-perforated steel liner']]},
      'wall-exposed':{showroom:'showroom.html#fireguard/wall-exposed',note:CALL,
        specs:[['Core','Mineral rockwool'],['Wall type','Self-supporting'],['Joint','Tongue-and-groove'],['Fastening','Visible, through-fastened with saddle washers']]},
      'wall-hidden':{showroom:'showroom.html#fireguard/wall-hidden',note:CALL,
        specs:[['Core','Mineral rockwool'],['Wall type','Self-supporting'],['Joint','Tongue-and-groove'],['Fastening','Concealed on each side, smooth finish']]},
      'interior-acoustic':{showroom:'showroom.html#fireguard/interior-acoustic',note:CALL,
        specs:[['Core','Mineral rockwool'],['Inside liner','Micro-perforated steel'],['Fastening','Visible'],['Made for','Sound absorption with fire resistance']]},
      'metal-doors':{showroom:'showroom.html#doors/office',note:'Sizes are nominal. Full specifications are provided with every quote.',
        specs:[['Leaf','0.5 mm steel faces'],['Frame','Aluminum'],['Hardware','Lever handle, key cylinder, hinges, door closer'],['Sizes','2.5′ × 7′, 3′ × 7′ and 4′ × 7′; double 6′ × 7′']]},
      'corner-angles':{showroom:'showroom.html#trim/al-outside-corner',note:'Sizes are nominal. Custom sizes and colors are available.',
        specs:[['Material','Aluminum'],['Thickness','1.5 mm (0.059″)'],['Fits','4″ (100 mm) panel'],['Length','6 m (19.7 ft)']]},
      't-bar':{showroom:'showroom.html#trim/al-t',note:'Sizes are nominal. Custom sizes and colors are available.',
        specs:[['Material','Aluminum'],['Thickness','3.0 mm (0.118″)'],['Width × height','120 × 150 mm (4.72 × 5.91″)'],['Length','6 m (19.7 ft)']]}
    }
  };
})();
