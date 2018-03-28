function moveMesh(mesh, keys, attrib, anim_type, dev, ep, act, rh, act_shot) {
    var animationPly = new BABYLON.Animation(name, attrib, fps, anim_type,
                                             BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var last_frame = keys.length -1;
               
    animationPly.setKeys(keys);
    //mesh.animations = [];
    mesh.animations.push(animationPly);
    scene.beginAnimation(mesh, keys[0].frame, keys[last_frame].frame, false, 1, 
      function () {
        var k = [];
        if(dev) { //se dev allora il cross/pass ha una ribalzo/deviazione
          //console.log(ep);
          if(act_shot) { //RIMBALZO DRITTO in caso di shot
            setBallMove(PLAIN, 1, dev);
          } else {
            k = setCurve(ep, 2, rh);
            console.log(act);
            moveMesh(sphere, k, "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3,null,null);
          }
        }
        //act da eseguire dopo il rimbalzo, va specificata qui e non alla fine del cross
        //perchè l'azione seguente (es. colpo di testa) interferisce con il ribalzo
        if(act) {  
          startAct(act);
        }
    });                           
}

/****
*imposta la traiettoria di un cross
*/
function setCurve(end_point, s, high) {
  var control = end_point.subtract(sphere.position);
  high = high || 40;
  control = control.scale(0.5);
  control = sphere.position.add(control);
  control.y = high;
  var bezier2 = BABYLON.Curve3.CreateQuadraticBezier(sphere.position, control, end_point, 4);
  var k = []; frame_end = 30;
  k.push({frame: 0, value: bezier2.getPoints()[0]});
  k.push({frame: (s*frame_end)/4, value: bezier2.getPoints()[1]});
  k.push({frame: (s*frame_end)*2/4, value: bezier2.getPoints()[2]});
  k.push({frame: (s*frame_end)*3/4, value: bezier2.getPoints()[3]});
  k.push({frame: (s*frame_end), value: bezier2.getPoints()[4]}); 
  return k;
}

function setBallMove(type, t, end_point, reb_point, act_beg) {
  var k = [];
  
  if(type == PLAIN) {
    if(reb_point) {
      k.push({frame: 0, value: sphere.position});
      k.push({frame: t*30, value: end_point });
      moveMesh(sphere, k, "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3,reb_point,end_point,false,20,true);
    } else {
    k.push({frame: 0, value: sphere.position});
    k.push({frame: t*30, value: end_point });    
    moveMesh(sphere, k, "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
    }
  } else if(type == CURVE) {
    k = setCurve(end_point, t);   
    moveMesh(sphere, k, "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
  } else if(type == REB) {
    k = setCurve(reb_point, t);
    moveMesh(sphere, k, "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3, reb_point, end_point, act_beg,20);
  } else if(type == DROP) {
    k = setCurve(end_point, t, 20);   
    moveMesh(sphere, k, "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3);  
  }
}


/***
* tM = mesh to rotate.
* lAt = vector3(xyz) of target position to look at 
* (http://www.babylonjs-playground.com/#Q4LKP#2)
*/   
function lookAt(tM, lAt) {
  //console.log(tM.position);
  lAt = lAt.subtract(tM.position);
  //act_dir = lAt.normalize();
  act_dir = tM.position.subtract(lAt).normalize();
  
  tM.rotation.y = -Math.atan2(lAt.z, lAt.x) - Math.PI/2;
}

function setSimpleAction(act, s, fi, ff, mm, mmp, ifun) {
  //console.log(act.to);
  if(act.type.substring(0, 3) != 'bkh') {
    //console.log('act type', act.type);
    lookAt(act.mesh, act.to);
  }
  if(mm) {
    moveMesh(act.mesh, mmp.k, mmp.attr, mmp.anim_type);
  }
  scene.beginAnimation(act.mesh.skeleton, fi, ff, false, s,function(){ifun()});
}

//esegue le azioni successive se presenti
function startAct(a_b) {
  //console.log(a_b);
  _.each(a_b, function(i){
    var act_beg = _.filter(action_list, function(a){return a.id == parseInt(i);});
    //console.log(act_beg);
    doAction(act_beg[0]);
  });
}

function getImpactOnGk(act) {
  var to_gk = new BABYLON.Vector3(0,0,144).subtract(act.mesh.position);
  var n = new BABYLON.Vector3(0,0,144).subtract(act.mesh.position).normalize();
  to_gk = act.mesh.position.add(to_gk);
  return to_gk.add(n.scale(-9));
}

/***
*Calcola il punto di arrivo di un passaggio o cross, perchè nei comandi è specificata la posizione di arrivo del
*player che non corrisponde con la posizione di impatto con la palla (es. per un colpo di testa)
*/
function getEndPoint(act) {
  var end_point, dest;
    
  first_act_succ = _.filter(action_list, function(act_p){return parseInt(act_p.id) == parseInt(act.beg[0]);});
  if(!first_act_succ[0]) return act.to;
  if(first_act_succ[0] &&
     first_act_succ[0].type == 'run'){ //recupera l'azione succ. a run per determinare la traiettoria che da alla palla
    first_act_succ = _.filter(action_list, function(act_p){return parseInt(act_p.id) == parseInt(act.beg[0])+1;});
  }
  if(first_act_succ[0] && _.indexOf(['sht', 'sft', 'sav', 'bkh', 'pas','run', 'rnb'], first_act_succ[0].type.substring(0, 3)) != -1)
  { //sht o act. del gk non deve avere correzione di act.to
    return act.to;
  } 
  //determina lo scale in base al tipo di azione  
  if(first_act_succ[0] && _.indexOf(['dhs', 'rns', 'sld'], first_act_succ[0].type.substring(0, 3)) != -1) {
    scale = 0.2;
  } else if(first_act_succ[0] && _.indexOf(['hds', 'jhs', 'tsh'], first_act_succ[0].type.substring(0, 3)) != -1) {
    scale = 0.1;
  }
  //console.log(scale);
  //corregge l'end point (lo sposta davanti per hds, sld, ...)
  dest = first_act_succ[0].to;       //determina la distanza tra la dest. del passaggio/cross 
  //console.log(first_act_succ[0].type);
  if(dest == 'sav') { // se l'act succ è parata
    dest = new BABYLON.Vector3(0, 0, 144); //setta la destinazione per il calcolo dell' end point
  }
  end_point = dest.subtract(act.to); //e la dest. dell'azione (es. colpo di testa)
  //console.log(act.to);
  end_point = end_point.scale(scale);//scala la distanza per avvicinare il punto al player
  end_point = act.to.add(end_point); //lo avvicina al player  
  return end_point;
}

/******
*0-20 tuffo sn
*30-50 tuffo ds
*60-80 resp. piede ds
*90-110 resp. piede sn
*120-140 resp. centrale
*/
function setSave(act, type) {
  var k = [], fi, ff, a, first_act_succ, act_prec;
  var pivotAt = new BABYLON.Vector3(0, 0, -8);
  
  if(type == SAVE) {
    if(act.type.substring(3,4) == 'r') {
      fi = 30; ff= 50;
      gk.rotation.z = Math.PI/4;
    } else {
      fi = 0; ff= 20;
      gk.rotation.z = -Math.PI/4;
    }
  } else if(type == SAVE_RESP) {
    fi = 120; ff= 140;
  } else if(type == SAVE_FOOT) {
    if(act.type.substring(3,4) == 'r') {
      fi = 60; ff= 80;
    } else {
      fi = 90; ff= 110;
    }
  /*} else if(type == SAVE_ENDUP) {
    if(act.dir == "r") {
      fi = 30; ff= 50;
    } else {
      fi = 0; ff= 20;
    }*/
  }
  //console.log(action_list);
  if(act.id == 2) { //se la parata è successiva ad una azione iniziale
    act_prec = act_ini; //l'azione precedente è qualla iniziale
  } else { //altrimenti cerca l'azione precedente nelle successive (action_list)
    act_prec = _.filter(action_list, function(act_p){                      
                      return parseInt(act_p.id) == parseInt(act.id) - 1;});
  }
  //console.log(act_prec);
  //first_act_succ = _.filter(action_list, function(act_p){return parseInt(act_p.id) == parseInt(act.beg[0]);});
  //console.log(act_prec[0].mesh.position);
  a = BABYLON.Angle.BetweenTwoPoints(
      new BABYLON.Vector2(act_prec[0].mesh.position.x, act_prec[0].mesh.position.z),new BABYLON.Vector2(0, 136));
  gk.setPivotMatrix(BABYLON.Matrix.Translation(pivotAt.x, pivotAt.y, pivotAt.z));
  gk.position = new BABYLON.Vector3(0, 0, 136+8);
  gk.animations = [];
  k.push({frame: 0, value: 0});
  k.push({frame: 30, value: Math.PI/2 - a.radians()});
  moveMesh(gk, k, "rotation.y", BABYLON.Animation.ANIMATIONTYPE_FLOAT);
  scene.beginAnimation(gk, fi, ff, false, 0.8,
     function(){
       if(act.to) {
         setBallMove(PLAIN, 1, act.to);
       }
       startAct(act.beg);
  });
}

/***
*restituisce il tempo dell'azione (es. t=2 il passaggio è più lento)
*/
function getActTime(a) {
  var first_act_succ, first_act_succ_succ, t=1;
  
  first_act_succ = _.filter(action_list, function(act){return parseInt(act.id) == parseInt(a.beg[0]);});
  first_act_succ_succ = _.filter(action_list, 
    function(act){return parseInt(act.id) == parseInt(first_act_succ[0].beg[0]);
  });  
  /*if(a.type.substring(0, 3) == 'pas') {
    if(first_act_succ[0].type == 'run' && (first_act_succ_succ[0].type.substring(0, 3) == 'sld' || 
                                           first_act_succ_succ[0].type.substring(0, 3) == 'rns')) {
      t=2;
    }  
  } else if(a.type.substring(0, 4) == 'cros') {    
    if(first_act_succ[0].type == 'run' && (first_act_succ_succ[0].type == 'jhs' || 
                                           first_act_succ_succ[0].type == 'hds' ||
                                           first_act_succ_succ[0].type == 'dhs' ||
                                           first_act_succ_succ[0].type.substring(0, 3) == 'sld')) {
      t = 2;      
    }
  }*/
  if(first_act_succ[0] && first_act_succ[0].type == 'run' &&
     first_act_succ_succ[0].type == 'rnd') {
    t = 2;
  }
  return t;
}

function geteSavEndPoint(a) {
  var end_point;
  //console.log(
  if(a.to == 'sav') {
      end_point = getImpactOnGk(a);
      a.to = end_point;
      console.log(a.to);
    } else {
      end_point = getEndPoint(a);
  }
  return end_point;
}

function createBallMove(p) {
  return function() {
    //console.log(p.to = 'sav');
    if(p.type == REB) {
      setBallMove(REB, p.t, p.end_point, p.a.dev, p.a.beg);
    } else {
      setBallMove(p.type, p.t, p.end_point);
      startAct(p.a.beg);
    }
    
  };
}

/***
0-10 stop
20-40 sldl
50-80 kickl
90-120 kickr
130-160 run
170-200 sldr
210-240 headshot
250-280 runshotr
290-320 runshotl
330-360 dipheadshot
380-410 turnshotr
430-460 turnshotl
480-510 backheelr
*/
anim_frame = {};
anim_frame['pasr'] = {'fi':90,'ff':120};
anim_frame['pasl'] = {'fi':50,'ff':80};
anim_frame['crossr'] = anim_frame['pasr'];
anim_frame['crossl'] = anim_frame['pasl'];
anim_frame['rnsr'] = {'fi':250,'ff':280};
anim_frame['rnsl'] = {'fi':290,'ff':320};
anim_frame['sldr'] = {'fi':170,'ff':200};
anim_frame['sldl'] = {'fi':20,'ff':40};
anim_frame['shtr'] = anim_frame['pasr'];
anim_frame['shtl'] = anim_frame['pasl'];
anim_frame['tshr'] = {'fi':380,'ff':410};
anim_frame['tshl'] = {'fi':430,'ff':460};
anim_frame['bkhr'] = {'fi':480,'ff':510};
function doAction(a) { 
  //console.log(a.type);
  //console.log(a.type.substring(3,4));
  var k = [], t = 1, first_act_succ, fi, ff, end_point;
  
  if(a.type.substring(0, 3) == 'pas') {
    first_act_succ = _.filter(action_list, function(act){return parseInt(act.id) == parseInt(a.beg[0]);});
    end_point = first_act_succ[0].type == 'idl'? a.to: getEndPoint(a);
    console.log(getActTime(a));
    //console.log(end_point);
    setSimpleAction(a, 1, anim_frame[a.type]['fi'], anim_frame[a.type]['ff'], false, {},
      createBallMove({'a':a,'type':PLAIN,'t':getActTime(a),'end_point':end_point}));
  } else if(a.type.substring(0, 4) == 'cros') { 
    //end_point = getEndPoint(a);
    console.log(a.to);
    setSimpleAction(a, 1, anim_frame[a.type]['fi'], anim_frame[a.type]['ff'], false, {}, 
      createBallMove({'a':a,'type':a.dev?REB:CURVE,'t':getActTime(a),'end_point':getEndPoint(a)}));
  } else if(a.type == 'run' || a.type == 'rnb') {
    //console.log(a.type);
    k.push({frame: 0, value: a.mesh.position});
    k.push({frame: 30, value: new BABYLON.Vector3(a.to.x,0,a.to.z)});
    setSimpleAction(a, 1, 130, 160, true, {'k':k, 'attr':"position",
      'anim_type':BABYLON.Animation.ANIMATIONTYPE_VECTOR3}, function(){startAct(a.beg);});
    if(a.type == 'rnb') { //se corsa con palla, muove la palla
      pos_run_ball(a, 8);
      var kr = [];
      kr.push({frame: 0, value: sphere.position});
      kr.push({frame: 30, value: new BABYLON.Vector3(a.to.x, -4.5, a.to.z)});
      moveMesh(sphere, kr, "position", BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
    }
  } else if(a.type == 'jhs') {
    k.push({frame: 0, value: a.mesh.position});
    k.push({frame: 30, value: new BABYLON.Vector3(a.mesh.position.x,6,a.mesh.position.z)});
    end_point = geteSavEndPoint(a);
    setSimpleAction(a, 1, 210, 240, true, {'k':k, 'attr':"position",
      'anim_type':BABYLON.Animation.ANIMATIONTYPE_VECTOR3},
      createBallMove({'a':a,'type':a.drop?DROP:PLAIN,'t':getActTime(a),'end_point':end_point}));
  } else if(a.type == 'hds') {
    setSimpleAction(a, 1, 210, 240, false, {}, 
      createBallMove({'a':a,'type':a.drop?DROP:PLAIN,'t':getActTime(a),'end_point':geteSavEndPoint(a)})
      /*function(){setBallMove(PLAIN, getActTime(a), getEndPoint(a));startAct(a.beg);
    }*/);
  } else if(a.type == 'dhs') {
    var pivotAt = new BABYLON.Vector3(0, -5, 0);
    a.mesh.setPivotMatrix(BABYLON.Matrix.Translation(-pivotAt.x, -pivotAt.y, -pivotAt.z));
    a.mesh.position = new BABYLON.Vector3(a.mesh.position.x, -5, a.mesh.position.z);
    a.mesh.animations = [];
    k.push({frame: 0, value: 0});
    k.push({frame: 15, value: -Math.PI/4});
    end_point = geteSavEndPoint(a);
    setSimpleAction(a, 1, 330, 360, true, {'k':k,'attr':"rotation.x",
      'anim_type':BABYLON.Animation.ANIMATIONTYPE_FLOAT},
      createBallMove({'a':a,'type':PLAIN,'t':1,'end_point':end_point})
      /*function(){setBallMove(PLAIN, 1, end_point);startAct(a.beg);}*/);
  } else if(a.type == 'idl') {
    setSimpleAction(a, 0.3, 0, 10, false, {},
      createBallMove({'a':a,'type':a.drop?DROP:PLAIN,'t':getActTime(a),'end_point':getEndPoint(a)}));
  } else if(a.type.substring(0, 3) == 'rns') {
    setSimpleAction(a, 1, anim_frame[a.type]['fi'], anim_frame[a.type]['ff'], false, {},
      function(){setBallMove(PLAIN, 1, a.to);startAct(a.beg);
    });
  } else if(a.type.substring(0, 3) == 'sav') {
    setSave(a, SAVE);
  } else if(a.type.substring(0, 3) == 'sft') {
    setSave(a, SAVE_FOOT);
  } else if(a.type.substring(0, 3) == 'sld') {
    k.push({frame: 0, value: a.mesh.position});
    k.push({frame: 30, value: new BABYLON.Vector3(a.mesh.position.x,-2,a.mesh.position.z)});
    setSimpleAction(a, 0.6, anim_frame[a.type]['fi'], anim_frame[a.type]['ff'], true, {'k':k, 'attr':"position",
      'anim_type':BABYLON.Animation.ANIMATIONTYPE_VECTOR3},
      createBallMove({'a':a,'type':a.drop?DROP:PLAIN,'t':1,'end_point':geteSavEndPoint(a)})
      /*function(){setBallMove(PLAIN, 1, a.to);startAct(a.beg);
    }*/);
  } else if(a.type.substring(0, 3) == 'sht') {
    /*if(a.type.substring(3,4) == 'r') {
      fi = 90; ff = 120;
    } else {
      fi = 50; ff = 80;
    }*/
    //console.log(a.type);
    end_point = geteSavEndPoint(a); //getEndPoint(a, 0);
    console.log(end_point);
    setSimpleAction(a, 1, anim_frame[a.type]['fi'], anim_frame[a.type]['ff'], false, {},
      function(){setBallMove(PLAIN, 1, end_point);startAct(a.beg);
    });
  } else if(a.type.substring(0, 3) == 'tsh') {
    var pivotAt = new BABYLON.Vector3(0, -5, 0);
    var sgn = a.type.substring(3, 4) == 'r' ? -1 : 1;
    //console.log(sgn);
    a.mesh.setPivotMatrix(BABYLON.Matrix.Translation(-pivotAt.x, -pivotAt.y, -pivotAt.z));
    a.mesh.position = new BABYLON.Vector3(a.mesh.position.x, -5, a.mesh.position.z);
    a.mesh.animations = [];
    k.push({frame: 0, value: 0});
    k.push({frame: 15, value: sgn*Math.PI/4});  
    end_point = a.to; //getEndPoint(a, 0);
    //console.log(end_point);
    setSimpleAction(a, 1, anim_frame[a.type]['fi'], anim_frame[a.type]['ff'], true, {'k':k,'attr':"rotation.z",
      'anim_type':BABYLON.Animation.ANIMATIONTYPE_FLOAT},
      function(){setBallMove(PLAIN, 1, end_point);startAct(a.beg);
    });
  } else if(a.type.substring(0, 3) == 'bkh') {
    setSimpleAction(a, 1, anim_frame[a.type]['fi'], anim_frame[a.type]['ff'], false, {},
      createBallMove({'a':a,'type':PLAIN,'t':getActTime(a),'end_point':getEndPoint(a)}));  
  }

}
