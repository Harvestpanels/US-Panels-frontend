/* Data center scene for js/building.js. A typical layout to show where each product goes: not a design, not to scale for any real job.
   Units: metres. The hall is 84 x 48 m and 12 m tall with a small entrance building on the front (+z).
   Product words, pictures and the pick-list come from the cards on data-centers.html; the rows in `info` below come from the live US Panels
   product copy, and from the nominal door / trim data already used in the 3D showroom. */
(function(){
  const U=window.USPB=window.USPB||{scenes:{}};
  const CALL='Thickness, weight and test data: call (405) 778-2808.';
  U.scenes['data-center']={
    modes:{
      out:{label:'Outside',title:'The outside',lead:'The roof, the walls, the entrance door and the corner trim. Tap a number on the building, or pick a part here.'},
      in:{label:'Inside',title:'The inside',lead:'The ceiling, the interior wall, seams, hangers and doors. Drag to look around, tap a number, or pick a part here.'}
    },
    views:{ out:{pos:[112,56,120],look:[0,2,10]}, in:{pos:[10,2.3,19],look:[-4,4.5,-18]} },
    parts:[
      // outside
      {key:'roof',pid:'roof-fireguard',mode:'out',n:1,label:'Roof',at:[30,12.55,-1],face:[0,1,0],view:{pos:[64,36,44],look:[24,12,0]}},
      {key:'wall-front',pid:'wall-hidden',mode:'out',n:2,label:'Front wall',at:[-24,6.5,24.35],face:[0,0,1],view:{pos:[-20,8,58],look:[-22,6,24]}},
      {key:'wall-side',pid:'wall-exposed',mode:'out',n:3,label:'Side wall',at:[42.35,6.5,6],face:[1,0,0],view:{pos:[76,9,20],look:[42,6,6]}},
      {key:'door-out',pid:'metal-doors',mode:'out',n:4,label:'Entrance door',at:[0,2.45,36.4],face:[0,0,1],view:{pos:[5,2.6,47],look:[0,1.6,36.2]}},
      {key:'corner-out',pid:'corner-angles',mode:'out',n:5,label:'Corner trim',at:[42.4,8.5,24.4],face:[.7,0,.7],view:{pos:[52,9,36],look:[42.2,8,24.2]}},
      // inside
      {key:'ceiling',pid:'roof-acoustic',mode:'in',n:1,label:'Ceiling',at:[-14,11.9,4],face:[0,-1,0],view:{pos:[-4,2.5,14],look:[-14,11,2]}},
      {key:'partition',pid:'interior-acoustic',mode:'in',n:2,label:'Interior wall',at:[-14,5,-17.85],face:[0,0,1],view:{pos:[-8,2.4,-8],look:[-14,5,-18]}},
      {key:'tbar',pid:'t-bar',mode:'in',n:3,label:'Seam trim',at:[12,11.93,-14],face:[0,-1,0],view:{pos:[12,2.6,-6],look:[12,11.5,-14]}},
      {key:'hangers',pid:'hardware',mode:'in',n:4,label:'Hangers',at:[-9.6,6.5,9.75],face:[1,0,0],view:{pos:[-2,3.2,14],look:[-12,7,8]}},
      {key:'door-in',pid:'metal-doors',mode:'in',n:5,label:'Interior door',at:[28,2.4,-17.8],face:[0,0,1],view:{pos:[22,2.2,-9],look:[28,1.6,-18]}},
      {key:'corner-in',pid:'corner-angles',mode:'in',n:6,label:'Corner trim',at:[41.75,7,-17.7],face:[-.7,0,.7],view:{pos:[33,2.4,-9],look:[42,6,-18]}}
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
        specs:[['Material','Aluminum'],['Thickness','3.0 mm (0.118″)'],['Width × height','120 × 150 mm (4.72 × 5.91″)'],['Length','6 m (19.7 ft)']]},
      'hardware':{showroom:'showroom.html#trim/strut-channel',note:'Sizes are nominal. Custom sizes and colors are available.',
        specs:[['Strut channel','Pre-galvanized, Z275'],['Section','41 × 41 mm (1.61 × 1.61″)'],['Thickness','2.5 mm (0.098″)'],['Length','6,096 mm (20 ft)']]}
    },

    build(H){
      const T=H.T, root=new T.Group(), out=new T.Group(), inn=new T.Group(); root.add(out,inn);
      const HX=42, HZ=24, WT=.15, WH=12, RT=.2, PZ=-18, AX=10, AD=12, AH=6;   // hall half-width / half-depth, wall thickness, wall height, roof thickness, partition z, annex half-width / depth / height
      const std=o=>new T.MeshStandardMaterial(Object.assign({envMapIntensity:.28},o));   // the studio reflections stay gentle so the sun does the shading
      const speck=(g,w,h,n,a,c)=>{ for(let i=0;i<n;i++){ g.fillStyle='rgba('+c+','+(Math.random()*a)+')'; g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*1.6,1+Math.random()*1.6); } };

      // ---- textures (one tile = 1 m of panel width) ----
      const seam=(g,w,h,base)=>{ g.fillStyle=base; g.fillRect(0,0,w,h); speck(g,w,h,900,.07,'60,66,72');
        g.fillStyle='rgba(0,0,0,.09)'; g.fillRect(w-10,0,10,h); g.fillStyle='#7f878e'; g.fillRect(0,0,6,h); g.fillStyle='rgba(255,255,255,.75)'; g.fillRect(6,0,4,h); };
      const tHidden=H.ct(512,512,(g,w,h)=>seam(g,w,h,'#dadeda'));
      const tExposed=H.ct(512,512,(g,w,h)=>{ seam(g,w,h,'#dadeda');
        [.2,.5,.8].forEach(c=>{ const x=c*w,y=.5*h; g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.arc(x+2,y+3,15,0,7); g.fill(); g.fillStyle='#9ba2a9'; g.beginPath(); g.arc(x,y,14,0,7); g.fill(); g.fillStyle='#6d747b'; g.beginPath(); g.arc(x,y,7,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.arc(x-4,y-5,3.2,0,7); g.fill(); }); });
      const tLiner=H.ct(512,512,(g,w,h)=>{ seam(g,w,h,'#dcdfdc'); for(let y=8;y<h;y+=16) for(let x=8;x<w;x+=16){ g.fillStyle='#69727a'; g.beginPath(); g.arc(x,y,2.5,0,7); g.fill(); } });
      const tRoof=H.ct(512,512,(g,w,h)=>{ g.fillStyle='#c4cacf'; g.fillRect(0,0,w,h);
        for(let i=0;i<4;i++){ const o=i*128; g.fillStyle='#b8bfc5'; g.fillRect(o,0,20,h); g.fillStyle='#9ea6ad'; g.fillRect(o+20,0,12,h); g.fillStyle='#dde1e4'; g.fillRect(o+32,0,64,h); g.fillStyle='#eceff1'; g.fillRect(o+40,0,10,h); g.fillStyle='#a9b1b8'; g.fillRect(o+96,0,12,h); g.fillStyle='#bcc3c9'; g.fillRect(o+108,0,20,h); }
        speck(g,w,h,700,.06,'60,66,72'); });
      const tFloor=H.ct(512,512,(g,w,h)=>{ g.fillStyle='#8f959a'; g.fillRect(0,0,w,h); speck(g,w,h,2200,.2,'70,74,78'); speck(g,w,h,1200,.14,'255,255,255'); g.strokeStyle='#9aa0a5'; g.lineWidth=4; g.strokeRect(0,0,w,h); });
      const tPad=H.ct(512,512,(g,w,h)=>{ g.fillStyle='#9a9ea1'; g.fillRect(0,0,w,h); speck(g,w,h,1800,.18,'60,64,68'); g.strokeStyle='#979c9f'; g.lineWidth=3; g.strokeRect(0,0,w,h); });
      const tAsphalt=H.ct(256,256,(g,w,h)=>{ g.fillStyle='#575c61'; g.fillRect(0,0,w,h); speck(g,w,h,1500,.35,'20,22,24'); speck(g,w,h,500,.25,'200,204,208'); });
      const tRack=H.ct(128,256,(g,w,h)=>{ g.fillStyle='#1d2228'; g.fillRect(0,0,w,h); g.fillStyle='#2b323a'; for(let y=6;y<h-4;y+=11) g.fillRect(6,y,w-12,8);
        for(let y=6;y<h-4;y+=11) for(let x=12;x<w-12;x+=9){ const r=Math.random(); g.fillStyle=r<.62?'#3ddc84':r<.8?'#4aa8ff':r<.9?'#ffb454':'#2b323a'; g.fillRect(x,y+3,3,2); } });

      // ---- materials ----
      const W=(map,u,v,pid,extra)=>{ const m=std(Object.assign({map:H.rep(map,u,v),roughness:.55,metalness:.1},extra)); if(pid) H.reg(pid,m); return m; };
      const edge=std({color:0xd7dad7,roughness:.6});
      const trimMat=H.reg('corner-angles',std({color:0xb3b9be,metalness:.45,roughness:.34}));
      const tbarMat=H.reg('t-bar',std({color:0xc3c8cc,metalness:.4,roughness:.32}));
      const zinc=H.reg('hardware',std({color:0xa7afb6,metalness:.6,roughness:.4}));
      const leafMat=H.reg('metal-doors',std({color:0xdcdfdb,metalness:.1,roughness:.45}));
      const frameMat=H.reg('metal-doors',std({color:0xa9aeb2,metalness:.55,roughness:.38}));
      const dark=std({color:0x25282c,roughness:.5,metalness:.2});
      const trayMat=std({color:0x9aa2a9,metalness:.5,roughness:.45});
      const rackMat=std({map:tRack,roughness:.6,metalness:.3});
      const slab=(w,h,d,x,y,z,mm,parent)=>{ const m=new T.Mesh(new T.BoxGeometry(w,h,d),mm); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; parent.add(m); return m; };
      const plane=(w,d,x,y,z,mm,parent)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,d),mm); m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.receiveShadow=true; parent.add(m); return m; };
      // box face order: +x, -x, +y, -y, +z, -z
      const hid=(u,v,pid)=>W(tHidden,u,v,pid), exp=(u,v,pid)=>W(tExposed,u,v,pid), inr=(u,v,pid)=>W(tHidden,u,v,pid,{color:0xe4e6e3});
      const roofTop=(u,v)=>W(tRoof,u,v,'roof-fireguard',{roughness:.5,metalness:.15});
      const ceil=(u,v)=>W(tLiner,u,v,'roof-acoustic',{roughness:.7,metalness:0});

      // ---- the hall: four walls and the roof ----
      const FW=2*HX, SD=2*HZ+2*WT;
      slab(FW,WH,WT,0,WH/2,HZ+WT/2,[edge,edge,edge,edge,hid(FW,WH,'wall-hidden'),inr(FW,WH,'wall-hidden')],root);                // front: outside +z
      slab(FW,WH,WT,0,WH/2,-HZ-WT/2,[edge,edge,edge,edge,inr(FW,WH,'wall-hidden'),hid(FW,WH,'wall-hidden')],root);               // back
      slab(WT,WH,SD,HX+WT/2,WH/2,0,[exp(SD,WH,'wall-exposed'),inr(SD,WH,'wall-exposed'),edge,edge,edge,edge],root);              // east (service side): exposed fastening
      slab(WT,WH,SD,-HX-WT/2,WH/2,0,[inr(SD,WH,'wall-hidden'),hid(SD,WH,'wall-hidden'),edge,edge,edge,edge],root);               // west
      slab(FW+2*WT,RT,SD,0,WH+RT/2,0,[edge,edge,roofTop(FW+2*WT,SD),ceil(FW+2*WT,SD),edge,edge],root);                            // roof: ribbed outside, perforated liner inside
      // entrance building
      slab(2*AX,AH,AD,0,AH/2,HZ+WT+AD/2,[hid(AD,AH,'wall-hidden'),hid(AD,AH,'wall-hidden'),roofTop(2*AX,AD),edge,hid(2*AX,AH,'wall-hidden'),edge],out);

      // ---- trim on the outside corners (aluminum angles) ----
      // an angle sits on two wall faces that meet at (cx, cz); ix, iz say which way the room (or the open air, for an outside corner) lies
      const angle=(cx,cz,ix,iz,h,y0,parent)=>{ slab(.14,h,.025,cx+ix*.07,y0+h/2,cz+iz*.0125,trimMat,parent); slab(.025,h,.14,cx+ix*.0125,y0+h/2,cz+iz*.07,trimMat,parent); };
      const outAngle=(cx,cz,sx,sz,h,parent)=>{ slab(.14,h,.025,cx-sx*.07,h/2,cz+sz*.0125,trimMat,parent); slab(.025,h,.14,cx+sx*.0125,h/2,cz-sz*.07,trimMat,parent); };   // (sx, sz) = the way the corner points out
      [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz])=>outAngle(sx*(HX+WT),sz*(HZ+WT),sx,sz,WH+RT,out));
      [1,-1].forEach(sx=>outAngle(sx*AX,HZ+WT+AD,sx,1,AH,out));

      // ---- the entrance door (outside, on the front of the entrance building) ----
      function door(x,y,z,s,parent){   // s = +1 faces +z
        const g=new T.Group(); g.position.set(x,y,z); parent.add(g);
        slab(.1,2.2,.08,-.5,1.1,s*.04,frameMat,g); slab(.1,2.2,.08,.5,1.1,s*.04,frameMat,g); slab(1.1,.1,.08,0,2.25,s*.04,frameMat,g);
        slab(.9,2.1,.05,0,1.05,s*.055,leafMat,g); slab(.14,.035,.07,.32,1.0,s*.11,dark,g); slab(.035,.035,.1,.38,1.0,s*.09,dark,g);
        return g; }
      door(0,0,HZ+WT+AD,1,out);
      const lamp=new T.Mesh(new T.BoxGeometry(.5,.12,.2),std({color:0xffffff,emissive:0xfff3d0,emissiveIntensity:.6,roughness:.5})); lamp.position.set(0,2.75,HZ+WT+AD+.12); out.add(lamp);

      // ---- the site (outside only) ----
      plane(1200,1200,0,-.04,0,std({color:0x76836d,roughness:1}),out);
      plane(190,170,0,-.02,15,std({map:H.rep(tPad,190/6,170/6),roughness:.95}),out);
      plane(400,16,0,-.01,118,std({map:H.rep(tAsphalt,400/6,16/6),roughness:1}),out);
      { const g=new T.Group(); out.add(g); const rail=std({color:0x2e3338,roughness:.6,metalness:.3}), X0=-78,X1=78,Z0=-54,Z1=72;
        const post=new T.InstancedMesh(new T.BoxGeometry(.12,2.1,.12),rail,200), mtx=new T.Matrix4(); let n=0;
        const put=(x,z)=>{ mtx.makeTranslation(x,1.05,z); post.setMatrixAt(n++,mtx); };
        for(let x=X0;x<=X1;x+=4){ put(x,Z0); put(x,Z1); } for(let z=Z0+4;z<Z1;z+=4){ put(X0,z); put(X1,z); } post.count=n; post.castShadow=true; g.add(post);
        [[0,Z0,X1-X0,.05],[0,Z1,X1-X0,.05],[X0,(Z0+Z1)/2,.05,Z1-Z0],[X1,(Z0+Z1)/2,.05,Z1-Z0]].forEach(([x,z,w,d])=>{ [.5,1.0,1.55,2.0].forEach(y=>slab(w,.05,d,x,y,z,rail,g)); }); }
      { const unit=std({color:0xb3b9be,roughness:.55,metalness:.35}), fan=std({color:0x2a2e33,roughness:.5});   // rooftop cooling units
        [[-30,-12],[-18,-12],[-6,-12],[6,-12],[18,-12],[30,-12],[-30,10],[-8,10],[14,10]].forEach(([x,z])=>{
          slab(4.2,2.2,2.6,x,WH+RT+1.1,z,unit,out); [-1,1].forEach(k=>{ const c=new T.Mesh(new T.CylinderGeometry(.85,.85,.12,20),fan); c.position.set(x+k*1.05,WH+RT+2.26,z); out.add(c); }); }); }
      { const gen=std({color:0xd4d8d6,roughness:.55,metalness:.2});   // generator yard
        [[56,-12],[56,-2],[56,8],[56,18]].forEach(([x,z])=>{ slab(7,2.9,2.6,x,1.45,z,gen,out); slab(.7,1.2,.7,x+2.4,3.45,z,dark,out); }); }

      // ---- the inside (inside only) ----
      plane(2*HX,2*HZ,0,.01,0,std({map:H.rep(tFloor,2*HX/6,2*HZ/6),roughness:.85}),inn);
      slab(2*HX,WH,.12,0,WH/2,PZ,[edge,edge,edge,edge,W(tLiner,2*HX,WH,'interior-acoustic',{roughness:.7,metalness:0}),W(tLiner,2*HX,WH,'interior-acoustic',{roughness:.7,metalness:0})],inn);   // interior wall (perforated both sides)
      door(28,0,PZ+.06,1,inn);
      [[HX,HZ,-1,-1],[-HX,HZ,1,-1],[HX,-HZ,-1,1],[-HX,-HZ,1,1],[HX,PZ+.06,-1,1],[-HX,PZ+.06,1,1]].forEach(([cx,cz,ix,iz])=>angle(cx,cz,ix,iz,WH,0,inn));   // inside corners
      const rows=[-12,-8,-4,0,4,8,12], pods=[[-33,-5],[5,33]], RW=.6, RD=1.2, RH=2.2, TRAY=2.95;
      { let count=0; pods.forEach(([a,b])=>{ count+=rows.length*Math.floor((b-a)/RW); });
        const racks=new T.InstancedMesh(new T.BoxGeometry(RW-.02,RH,RD),rackMat,count), m4=new T.Matrix4(); let n=0;
        pods.forEach(([a,b])=>rows.forEach(z=>{ for(let x=a+RW/2;x<b;x+=RW) { m4.makeTranslation(x,RH/2,z); racks.setMatrixAt(n++,m4); } }));
        racks.castShadow=racks.receiveShadow=true; inn.add(racks); }
      pods.forEach(([a,b])=>rows.forEach(z=>slab(b-a,.08,.5,(a+b)/2,TRAY,z,trayMat,inn)));   // cable trays above every row
      { const hangX=[]; pods.forEach(([a,b])=>{ for(let x=a+2;x<b;x+=4) hangX.push(x); });
        const L=WH-TRAY-.04, rods=new T.InstancedMesh(new T.CylinderGeometry(.03,.03,L,6),zinc,rows.length*hangX.length*2), bars=new T.InstancedMesh(new T.BoxGeometry(.05,.05,.8),zinc,rows.length*hangX.length), m4=new T.Matrix4(); let r=0,b=0;
        rows.forEach(z=>hangX.forEach(x=>{ [-.3,.3].forEach(k=>{ m4.makeTranslation(x,TRAY+L/2+.04,z+k); rods.setMatrixAt(r++,m4); }); m4.makeTranslation(x,TRAY-.07,z); bars.setMatrixAt(b++,m4); }));
        inn.add(rods,bars); }
      [-36,-24,-12,0,12,24,36].forEach(x=>slab(.14,.06,2*HZ,x,WH-.03,0,tbarMat,inn));            // T-bar on the ceiling panel seams
      const lightMat=new T.MeshBasicMaterial({color:0xffffff}); [-10,-2,6,14].forEach(z=>slab(30,.04,.25,0,WH-.07,z,lightMat,inn));
      [[-18,-4],[18,-4],[-18,12],[18,12]].forEach(([x,z])=>{ const l=new T.PointLight(0xfff6e6,.5,70,1.4); l.position.set(x,9.5,z); H.lights.push(l); });
      return {root,out,inn};
    }
  };
})();
