/***
*preleva la lista di azioni da actions_url e la assegna ad a_l_o e crea i pulsanti per
*startare le relative azioni
*/
function getActions(m, s) {
  var actions_url = "https://raw.githubusercontent.com/doctorjay66/digirep/master/actions5.jason";
  //var actions_url = "http://localhost:8000/basic_player/actions4.jason";
  //var actions_url = "https://rawgit.com/doctorjay66/babylonjs/master/actions2.jason"
  $("div.btnStart").empty();
  $.getJSON(actions_url, function(result){
    //var acts_list = [];
    console.log(result);
    $.each(result, function(i, field){
      //acts_list.push(i);
      //console.log(i.replace(' ', '_'));
      $("div.btnStart").append('<input type="button"'+' id="'+i.replace(' ', '_')+'"'+' value='+'"' +i+'" />');
      $("input#"+i.replace(' ', '_')).click(function(){startActions(i);}) //i='act 1', 'act 2', ...
    });
    a_l_o = result; //setta action list object 
    /*a_l_o = {"act 1":
{"p0_0":{"id":-1, "type":"", "mesh":"player1", "to":"100,0,35", "f":-1, "beg":"", "state":"MAIN"},
 "a0_5":{"id":5, "type":"cross", "mesh":"player3", "to":"-23,8.5,132", "f":30, "beg":"","state":0}}}*/
    $('.btnStart').css('visibility', 'visible');
  });
}

/***
*converte una stringa "num1, num2,  num3" in un 3-vettore babylon
*usata da:getActions
*/    
function str_to_point(str_p) {              
  var point;
  point = str_p.split(",");
  point[0] = parseInt(point[0]);
  point[1] = parseInt(point[1]);
  point[2] = parseInt(point[2]);
  return new BABYLON.Vector3(point[0], point[1], point[2]);       
}

/***
*ritorna l'azione successiva a quelle iniziali che ha l'id passato come param
*usata da startAct
*/
function getActSucc(id) {
  var a_succ; 
  action_list.forEach(function(val) { 
    //console.log(val.id);
    if(val.id == id) {
      //console.log([val]);
      a_succ = val;
    } 
  });
  return a_succ;
}

/***
*setta le posizioni iniziali della azione specificata da ad dei vari player utilizzando l'id=-1
*/
function setPos(ad) {
  obj_pos_list = $.map(a_l_o[ad], function(val, key) {
    if(val.id == -1 && val.type != "a") {
      return val;
    }
  });
  
  obj_posa_list = $.map(a_l_o[ad], function(val, key) { //posizioni iniziali degli avversari
    if(val.id == -1 && val.type == "a") {
      return val;
    }
  });
  //console.log(obj_posa_list);
  
  $.each(p_mesh, function(i, field){        //resetta il campo eliminando i player
    if(i != "player1" && i != "player1a") { //tranne i quelli base
      field.dispose();
      delete p_mesh[i];
    }
  });
  
  //pos. i player per l'azione iniziale
  obj_pos_list.forEach(function(val) {    
    if(val.mesh == "player1") {
      player1.visibility = true;
      player1.position = str_to_point(val.to);
      sphere.position = str_to_point(val.to);
      sphere.position.y = -4.5;
      p_mesh['player1'] = player1;
      
      //sphere.position.x = player1.position.x;  
      //sphere.position.z = player1.position.z;
      
    } else { //clona player1 per creare e posizionare gli altri player
      p_mesh[val.mesh] = player1.clone(val.mesh);
      p_mesh[val.mesh].skeleton = skeleton.clone("clonedSkeleton");
      p_mesh[val.mesh].position = str_to_point(val.to);
    }
  });
  
  //pos. i player avversari per l'azione iniziale
  obj_posa_list.forEach(function(val) { 
    if(val.mesh == "player1a") {
      player1a.visibility = true;
      player1a.position = str_to_point(val.to);
      p_mesh['player1a'] = player1a;
    } else {
      p_mesh[val.mesh] = player1a.clone(val.mesh);
      p_mesh[val.mesh].skeleton = skeletona.clone("clonedSkeleton");
      p_mesh[val.mesh].position = str_to_point(val.to);
    }
  });
}

//trasforma le proprieta caricate che sono stringhe
//nei valori appropriati (es. "10,0,10" in vettore 3dim)
function set_act_obj(val) {
    val.id = parseInt(val.id);     
    val.type = val.type;
    if(val.mesh == 'ball') {
      val.mesh = sphere;
    } else {
      val.mesh = p_mesh[val.mesh];
    }
    if(val.type != 'tackle') {
      val.to = str_to_point(val.to);
    }
    if(val.type == 'passdr' || val.type == 'passdl'  
       || val.type == 'crossr' || val.type == 'crossl') {
      val.dev = str_to_point(val.dev);
    }
    val.beg = val.beg.split(",");    
    if(val.beg == "") {val.beg = [];}
    val.state = val.state;
}

function setIniAct(ad) {
  act_init = $.map(a_l_o[ad], function(val, key) {
    if(val.state == 0) { //le azioni iniziali haano lo stato = 0
      return val;
    }
  });
  act_init.forEach(set_act_obj); 
}

function setActions(ad) {
  action_list = $.map(a_l_o[ad], function(val, key) {
    if(val.state == -1) {
      return val;
    }
  });
  action_list.forEach(set_act_obj);
  //console.log(action_list);
}

/***
* tM = mesh to rotate.
* lAt = vector3(xyz) of target position to look at 
* (http://www.babylonjs-playground.com/#Q4LKP#2)
*/   
function lookAt(tM, lAt) {
  //console.log(tM.position);
  lAt = lAt.subtract(tM.position);
  tM.rotation.y = -Math.atan2(lAt.z, lAt.x) - Math.PI/2;
}  

//esegue le azioni che sono attivate da quelle iniziali (azioni successive)
function startAct(a_b) {
  //console.log('start act',a_b);
  for(var i=0;i<a_b.length;i++) {
    //console.log(i, a_b[i]);            
    //console.log(getActSucc(a_b[i]));
    doAction(getActSucc(a_b[i]));
  }
}

/***
*trasla una act.mesh dalla sua pos. seguendo un traiettoria impostata in keys 
*/
function mesh_move(mesh, name, keys, i, f) {
  //console.log(mesh, name, keys, i, f);		  
  var animationPly = new BABYLON.Animation(name, "position", fps, 
                           BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                           BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

  animationPly.setKeys(keys);
  mesh.animations = [];
  mesh.animations.push(animationPly);
  scene.beginAnimation(sphere, i, f, false);
  /*var event1 = new BABYLON.AnimationEvent(f, 
                            function(){
                              //console.log(act.type, act.beg);
                              act.state = OVER;                              
                            }, 
  true);
  animationPly.addEvent(event1);     */     
} 

function startPlyCross(act, side, s) {
  var fi, ff; //frame iniziale e finale della anim. kick
  if(side == 'l') {
    fi = 30; ff = 50;
  } else {
    fi = 60; ff = 80;
  }
  lookAt(act.mesh, act.to);
  scene.beginAnimation(act.mesh.skeleton, fi, ff, false, 1.0,
            function(){
              var destination = act.to;
              //var destination = pos_for(sphere.position, act.to);
              /*calcolare la dir del colpo di testa
              * scalarla di n
              * destination = act.to + dir. scalata
              */
              var control = destination.subtract(sphere.position);
              var bezier2;
              control = control.scale(0.5);
              control = sphere.position.add(control);
              control.y = 40;
              bezier2 = BABYLON.Curve3.CreateQuadraticBezier(sphere.position, control, destination, 4);
              var k = []; s = 2; frame_end = 30;
              k.push({frame: 0, value: bezier2.getPoints()[0]});
              k.push({frame: (s*frame_end)/5, value: bezier2.getPoints()[1]});
              k.push({frame: (s*frame_end)*2/5, value: bezier2.getPoints()[2]});
              k.push({frame: (s*frame_end)*3/5, value: bezier2.getPoints()[3]});
              k.push({frame: (s*frame_end)*4/5, value: bezier2.getPoints()[4]});
              k.push({frame: s*frame_end, value: act.dev});
              mesh_move(sphere, "m"+act.id, k, k[0].frame, k[5].frame);
              //mesh_move({mesh:sphere, to:null, state:-1}, {start:0,end:30}, bezier2.getPoints(), s);
              startAct(act.beg);
 });
}

function setShotCurv(act) {
  var bezier2, control, k, frame_end;
  control = act.to.subtract(sphere.position);
  control = control.scale(0.5);
  control = sphere.position.add(control);
  control.x = 20;
  control.y = 20;
  control.z = 120;
  bezier2 = BABYLON.Curve3.CreateQuadraticBezier(sphere.position, control, act.to, 4);
  k = []; frame_end = 30;
  k.push({frame: 0, value: bezier2.getPoints()[0]});
  k.push({frame: frame_end/4, value: bezier2.getPoints()[1]});
  k.push({frame: frame_end*2/4, value: bezier2.getPoints()[2]});
  k.push({frame: frame_end*3/4, value: bezier2.getPoints()[3]});
  k.push({frame: frame_end, value: bezier2.getPoints()[4]});
  lookAt(act.mesh, act.to);
  mesh_move(sphere, "m"+act.id, k, k[0].frame, k[4].frame);
}

function startPlyKick(act, s, side, d) {
  var fi, ff; //frame iniziale e finale della anim. kick
  lookAt(act.mesh, act.to);
  if(side == 'l') {
    fi = 30; ff = 50;
  } else {
    fi = 60; ff = 80;
  }
  scene.beginAnimation(act.mesh.skeleton, fi, ff, false, 1.0, 
    function(){
    act.state = OVER;
    var k = [];
    if(d) {
      k.push({frame: 0, value: sphere.position});
      k.push({frame: s*30/2, value: act.dev});
      k.push({frame: s*30, value: act.to}); 
      mesh_move(sphere, "m"+act.id, k, k[0].frame, k[2].frame);     
    } else {
      k.push({frame: 0, value: sphere.position});
      k.push({frame: s*30, value: act.to /*new BABYLON.Vector3(act.to.x, -4.5, act.to.z)*/});
      mesh_move(sphere, "m"+act.id, k, k[0].frame, k[1].frame);
    }
    
    /*mesh_move({mesh:sphere, to:new BABYLON.Vector3(act.to.x,-4.5,act.to.z), state:-1}, 
              {start:0,end:act.f}, false, s);*/
    startAct(act.beg);           
  });
}

function setPlyRun(act, frame) {
  var animationPly = new BABYLON.Animation("", "position", fps, 
                                                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                                                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  var keys = [];
  keys.push({frame: frame.start, value: act.mesh.position});
  keys.push({frame: frame.end, value: act.to});            
          animationPly.setKeys(keys);
          act.mesh.animations.push(animationPly);
          lookAt(act.mesh, act.to)
          scene.beginAnimation(act.mesh, 0, fps, false);
  scene.beginAnimation(act.mesh.skeleton, /*61, 80,*/1, 20, false,  1.0, function(){/*console.log(act.id + 'over run');*/});
  var event1 = new BABYLON.AnimationEvent(frame.end, 
                            function(){
                              //console.log(act.id + 'over run');
                              act.state = OVER;
                              startAct(act.beg);
                            }, 
                            true);
          //console.log(trigger_action);
  animationPly.addEvent(event1);
}

function setPlyHeadShot(act, frame, jump) {
  var animationPly = new BABYLON.Animation("", "position", fps, 
                                                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                                                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  if(jump) {
  var keys = [];
  var to = new BABYLON.Vector3(act.mesh.position.x,4,act.mesh.position.z)
  keys.push({frame: frame.start, value: act.mesh.position});
  keys.push({frame: 30, value: to});            
  animationPly.setKeys(keys);
  act.mesh.animations.push(animationPly);
  scene.beginAnimation(act.mesh, 0, 30, false);
  }
  lookAt(act.mesh, act.to)  
  scene.beginAnimation(act.mesh.skeleton, 100, 120, false, 0.5,
      function(){
        console.log('over head shot');
        act.state = OVER;
        var k = [];
        k.push({frame: 0, value: sphere.position});
        k.push({frame: 30, value: act.to /*new BABYLON.Vector3(a.to.x, -4.5, a.to.z)*/});
        //mesh_move(sphere, "m"+act.id, k, k[0].frame, k[1].frame);        
        //mesh_move({mesh:sphere, to:new BABYLON.Vector3(act.to.x,-4.5,act.to.z), state:-1}, 
          //        {start:0,end:act.f}, false, 1);
        startAct(act.beg);           
  });
}

function setTackle(act) {
  //lookAt(act.mesh, new BABYLON.Vector3(28,0,104));
  console.log(act.to);
  if(act.to == 'r') {
    act.mesh.rotation.y = Math.PI/2 //rot. dx
  } else if(act.to == 'l') {
    act.mesh.rotation.y = -Math.PI/2 //rot. sx
  }
  scene.beginAnimation(act.mesh.skeleton, 140, 160, false, 1,
      function(){
        console.log('over tackle');
      });
}

function setSave(act) {
  var fi, ff;
  lookAt(gk, act.to)
  gk.rotation.z = Math.PI/4;
  if(act.dir == "r") {
    fi = 30; ff= 50;
  } else {
    fi = 0; ff= 20;
  }
  scene.beginAnimation(gk, fi, ff, false, 1);
}

/*function pos_for(from, to) {
  var destb = to;
  var dirb =  destb.subtract(from);
  dirb = dirb.normalize();
  dirb = dirb.scale(2);
  return to.add(dirb);
}*/

/***
*posiziona la palla davanti al player per la corsa con il suo possesso
*/
function pos_run_ball(to) {
  var destb = to;
  var dirb =  destb.subtract(sphere.position);
  dirb = dirb.normalize();
  dirb = dirb.scale(8);
  sphere.position = sphere.position.add(dirb);
}

function doAction(a) {
    if(a.type == 'pass') {
      startPlyKick(a, 1, false);
    } else if(a.type == 'run') {
      setPlyRun(a, {start:0,end:a.f});      
    } else if(a.type == 'runb') {
      setPlyRun(a, {start:0,end:a.f});
      pos_run_ball(new BABYLON.Vector3(a.to.x,-4.5,a.to.z));
      var k = [];
      k.push({frame: 0, value: sphere.position});
      k.push({frame: 30, value: new BABYLON.Vector3(a.to.x, -4.5, a.to.z)});
      mesh_move(sphere, "m"+a.id, k, k[0].frame, k[1].frame);
    } else if(a.type == 'crossr') {
      startPlyCross(a, 'r', 2);
    } else if(a.type == 'crossl') {
      startPlyCross(a, 'l', 2);
    } else if(a.type == 'shotcurv') {
      setShotCurv(a);
    } else if(a.type == 'jheadshot') {
      setPlyHeadShot(a, {start:0,end:a.f}, true);
    } else if(a.type == 'headshot') {
      setPlyHeadShot(a, {start:0,end:a.f}, false);
    } else if(a.type == 'tackle') {
      setTackle(a);
    } else if(a.type == 'passdr') { //passaggio con deviazione
      startPlyKick(a, 1, 'r', true);
    } else if(a.type == 'passdl') {
      startPlyKick(a, 1, 'l', true);
    } else if(a.type == 'passr') { 
      startPlyKick(a, 1, 'r');
    } else if(a.type == 'passl') {
      startPlyKick(a, 1, 'l');
    } else if(a.type == 'save') {
      setSave(a);
    }
}

function startActions(ad) {    
  act_to_start = ad;  
  setPos(act_to_start); //act_to_start = 'act 1' se premuto pulsante act1
  setIniAct(act_to_start); //inizializza act_init
  setActions(act_to_start); //inizializza action_list utilizzata da startAct
    
  for(var i=0;i<act_init.length;i++) {
    doAction(act_init[i]);
  }
}
