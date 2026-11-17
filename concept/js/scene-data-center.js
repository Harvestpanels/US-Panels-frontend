/* Data center scene for js/building.js: a 360-degree tour (panoramas rendered in Blender: scripts/uspanels_datacenter.py --pano), the still pictures used
   when WebGL is missing, a pin on every part, and a close-up render for each part. World coordinates are Blender's: x east, y north (down the hall), z up, metres.
   The renders are of a typical data center, not a US Panels job (the page says so). Panel shapes, fasteners and doors/trim follow the product models; panel
   thickness and the size of the perforation are illustrative. To use real job photos instead, change the images and re-place the pins.
   Product words, pictures and the pick-list come from the cards on data-centers.html; the rows in `info` come from the live US Panels product copy,
   and from the nominal door / trim data already used in the 3D showroom. */
(function(){
  const U=window.USPB=window.USPB||{scenes:{}};
  const CALL='Thickness, weight and test data: call (405) 778-2808.';
  const D='img/dc/';
  const fl=(x,y)=>[x,y,.15];
  U.scenes['data-center']={
    modes:{
      out:{label:'Outside',title:'The outside',lead:'Drag to look around, tap an arrow to walk to the next spot, and tap a number to see a part up close. Or pick a part here.'},
      in:{label:'Inside',title:'The inside',lead:'Drag to look around, tap an arrow to walk down the aisle, and tap a number to see a part up close. Or pick a part here.'}
    },
    tour:{ stations:{
      o1:{mode:'out',label:'Front entrance',src:D+'pano_o1.jpg',pos:[3,-38,1.7],yaw:0,pitch:3,links:[
        {to:'o2',label:'Walk to the corner'},{to:'i1',label:'Go inside',at:[0,-29.5,.15],look:[0,2]}]},
      o2:{mode:'out',label:'The corner',src:D+'pano_o2.jpg',pos:[40,-32,1.7],yaw:-34,pitch:6,links:[
        {to:'o1',label:'Back to the entrance'},{to:'o3',label:'Along the side wall'},{to:'o4',label:'Up to the roof',at:[30,-18,7.9]}]},
      o3:{mode:'out',label:'The side wall',src:D+'pano_o3.jpg',pos:[37,2,1.7],yaw:-90,pitch:6,links:[
        {to:'o2',label:'Back to the corner'}]},
      o4:{mode:'out',label:'On the roof',src:D+'pano_o4.jpg',pos:[0,-6,9.9],yaw:0,pitch:-14,links:[
        {to:'o1',label:'Back down',at:[0,-17.6,8.15]}]},
      i1:{mode:'in',label:'Start of the aisle',src:D+'pano_i1.jpg',pos:[0,-3,1.65],yaw:0,pitch:6,links:[
        {to:'i2',label:'Walk down the aisle'}]},
      i2:{mode:'in',label:'Middle of the aisle',src:D+'pano_i2.jpg',pos:[0,5,1.65],yaw:0,pitch:6,links:[
        {to:'i1',label:'Back'},{to:'i3',label:'To the door'}]},
      i3:{mode:'in',label:'The door at the end',src:D+'pano_i3.jpg',pos:[0,9,1.65],yaw:0,pitch:4,links:[
        {to:'i2',label:'Back'},{to:'i4',label:'Along the back wall',at:fl(9,10.8)}]},
      i4:{mode:'in',label:'The back corner',src:D+'pano_i4.jpg',pos:[22,10.8,1.7],yaw:80,pitch:6,links:[
        {to:'i3',label:'Back to the door'}]}
    }},
    images:{    // used only when the browser has no WebGL
      out:{src:D+'ext_main.jpg',w:1600,h:900,alt:'3D render of a data center from outside: a long insulated metal panel building with a smooth front wall, a side wall with visible fasteners, a ribbed roof, an entrance door and aluminum corner trim.'},
      in:{src:D+'int_main.jpg',w:1600,h:900,alt:'3D render of the inside of a data center hall: rows of server racks, a perforated white ceiling with aluminum seam trim, and a perforated white wall with a grey metal door at the end of the aisle.'}
    },
    // at = where the pin sits in the 3D model; st = the spots it shows from; x, y = place on the still picture
    parts:[
      {key:'roof',pid:'roof-fireguard',mode:'out',n:1,label:'Roof',at:[0,4,8.45],st:['o4'],x:50,y:30,detail:D+'ext_roof.jpg',look:'The long ribs running down the roof.'},
      {key:'wall-front',pid:'wall-hidden',mode:'out',n:2,label:'Front wall',at:[-14,-18.1,3.4],st:['o1','o2'],x:30,y:55,detail:D+'ext_wall_front.jpg',look:'A smooth face with only fine panel joints and no fasteners showing.'},
      {key:'wall-side',pid:'wall-exposed',mode:'out',n:3,label:'Side wall',at:[30.2,-4,3.6],st:['o2','o3'],x:80,y:55,detail:D+'ext_wall_side.jpg',look:'The rows of round fastener heads across each panel.'},
      {key:'door-out',pid:'metal-doors',mode:'out',n:4,label:'Entrance door',at:[0,-26.3,1.15],st:['o1'],x:15,y:65,detail:D+'ext_door.jpg',look:'The grey door in its aluminum frame.'},
      {key:'corner-out',pid:'corner-angles',mode:'out',n:5,label:'Corner trim',at:[30.1,-18.1,4.6],st:['o1','o2','o3'],x:62,y:60,detail:D+'ext_corner.jpg',look:'The aluminum angle where the smooth wall meets the fastened wall.'},
      {key:'ceiling',pid:'roof-acoustic',mode:'in',n:1,label:'Ceiling',at:[0,4,7.98],st:['i1','i2','i3'],x:50,y:10,detail:D+'int_ceiling.jpg',look:'The fine perforations across the white ceiling.'},
      {key:'partition',pid:'interior-acoustic',mode:'in',n:2,label:'Interior wall',at:[-3.5,11.9,2.6],st:['i1','i2','i3','i4'],x:35,y:40,detail:D+'int_wall.jpg',look:'The perforated white wall at the end of the aisle.'},
      {key:'tbar',pid:'t-bar',mode:'in',n:3,label:'Seam trim',at:[3,8,7.9],st:['i1','i2','i3'],x:65,y:12,detail:D+'int_ceiling.jpg',look:'The aluminum bars where ceiling panels meet.'},
      {key:'door-in',pid:'metal-doors',mode:'in',n:4,label:'Interior door',at:[.5,11.9,1.2],st:['i1','i2','i3'],x:52,y:44,detail:D+'int_door.jpg',look:'The grey door set in the perforated wall.'},
      {key:'corner-in',pid:'corner-angles',mode:'in',n:5,label:'Corner trim',at:[29.9,11.9,3.4],st:['i4'],x:70,y:44,detail:D+'int_corner.jpg',look:'The aluminum angle in the inside corner.'}
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
