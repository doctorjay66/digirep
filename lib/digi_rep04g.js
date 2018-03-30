var actions = {}, act_id = "", pos_id = 1, act_i = 1;
var act_ini;

/***
*posiziona la palla davanti al player per la corsa con il suo possesso
*/
function pos_run_ball(a, s) {
  var destb = new BABYLON.Vector3(a.to.x,-4.5,a.to.z);
  sphere.position = new BABYLON.Vector3(a.mesh.position.x,-4.5,a.mesh.position.z);
  var dirb =  destb.subtract(sphere.position);
  dirb = dirb.normalize();
  dirb = dirb.scale(s);
  sphere.position = sphere.position.add(dirb);
}

/***
*setta le posizioni iniziali della azione specificata da ad dei vari player estraendo
*dall'oggetto lista azioni quelle con l'id=-1 e assegna la lista p_mesh che serve per
*assegnare le mesh nella lista delle azioni
*/
function setPos(ad) {
  var obj_pos_list, f_pos;
  obj_pos_list = $.map(ad, function(val, key) {
    if(val.id == -1 && val.type != "a") {
      return val;
    }
  });
  
  obj_posa_list = $.map(ad, function(val, key) { //posizioni iniziali degli avversari
    if(val.id == -1 && val.type == "a") {
      return val;
    }
  });
  
  //console.log(obj_pos_list);
  $.each(p_mesh, function(i, field){        //resetta il campo eliminando i player
    if(i != "p1" && i != "p1a") { //tranne i quelli base
      field.dispose();
      delete p_mesh[i];
    }
  });
  
  //pos. i player per l'azione iniziale
  obj_pos_list.forEach(function(val) {    
    if(val.mesh == "p1") {
      player1.visibility = true;
      f_pos = val.to.split(",");
      player1.position = field_zone_m[f_pos[0]][f_pos[1]]; //field_zone[val.to]; //str_to_point(val.to);
      //console.log(player1.position);
      if(val.beg) {
        sphere.position.x = player1.position.x; //str_to_point(val.to);
        sphere.position.y = -4.5;
        sphere.position.z = player1.position.z;
      }
      p_mesh['p1'] = player1;
    } else { //clona player1 per creare e posizionare gli altri player
      p_mesh[val.mesh] = player1.clone(val.mesh);
      p_mesh[val.mesh].skeleton = skeleton.clone("clonedSkeleton");
      f_pos = val.to.split(",");
      p_mesh[val.mesh].position = field_zone_m[f_pos[0]][f_pos[1]]; //field_zone[val.to]; //str_to_point(val.to);
    }
  });
  
  //pos. i player avversari per l'azione iniziale
  obj_posa_list.forEach(function(val) { 
    if(val.mesh == "p1a") {
      player1a.visibility = true;
      console.log(val.to);
      f_pos = val.to.split(",");
      player1a.position = field_zone_m[f_pos[0]][f_pos[1]]; //field_zone[val.to]; //str_to_point(val.to);
      //console.log(player1a.position);
      if(val.beg) {
        sphere.position.x = player1a.position.x; //str_to_point(val.to);
        sphere.position.y = -4.5;
        sphere.position.z = player1a.position.z;
      }
      p_mesh['p1a'] = player1a;
    } else {
      p_mesh[val.mesh] = player1a.clone(val.mesh);
      p_mesh[val.mesh].skeleton = skeletona.clone("clonedSkeleton");
      f_pos = val.to.split(",");
      p_mesh[val.mesh].position = field_zone_m[f_pos[0]][f_pos[1]]; //field_zone[val.to]; //str_to_point(val.to);
    }
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
  //return field_zone[str_p];
}


//trasforma le proprieta caricate che sono stringhe
//nei valori appropriati (es. "10,0,10" in vettore 3dim)
function set_act_obj(val) {
    var f_pos;
         
    val.type = val.type;
    if(val.mesh == 'ball') {
      val.mesh = sphere;
    } if(val.mesh == 'gk') {
      val.mesh = gk;
    } else {
      val.mesh = p_mesh[val.mesh];
    }
    //console.log(val.to);
    if(val.to) { //se val.to non è null (nella save può esserlo)
      /*if(val.to.substring(val.to.length-1) == 'g') {              //nelle descrizioni delle posizioni (dcm, ...)
        val.to = field_zone[val.to.substring(0, val.to.length-1)].clone();//la y=0, per specificare l'altezza campo si usa
        val.to.y = -4;                                            //g alla fine
        console.log(val.to);
      } else if(val.to.substring(val.to.length-1) == 'u') { //altezza player
        val.to = field_zone[val.to.substring(0, val.to.length-1)].clone();
        val.to.y = 4;
      } else if(val.to.substring(val.to.length-1) == 'h') {
        console.log(val.to.substring(0, val.to.length-1));
        val.to = field_zone[val.to.substring(0, val.to.length-1)].clone();
        val.to.y = 8;*/
      f_pos = val.to.split(",");
      if(val.hd && val.hd=="u") {        
        val.to = field_zone_m[f_pos[0]][f_pos[1]];
        val.to.y = 4;
      } else if(val.hd && val.hd=="g") {
        val.to = field_zone_m[f_pos[0]][f_pos[1]];
        val.to.y = -5;
      } else if(val.hd && val.hd=="b") {
        val.to = field_zone_m[f_pos[0]][f_pos[1]];
        val.to.y = 2;
      } else if(val.to == 'sav') { //se dest è una parata il valore rimane inalterato
        val.to = val.to;
      } else if(val.to == 'gllc') {
        val.to = goal_zone[val.to];
      } else {
        f_pos = val.to.split(",");      
        val.to = field_zone_m[f_pos[0]][f_pos[1]]; //field_zone[val.to]; //str_to_point(val.to);
        //console.log(val.to);
      }
    }
    /*if(val.type == 'passdr' || val.type == 'passdl'  
       || val.type == 'crossr' || val.type == 'crossl') {
      val.dev = str_to_point(val.dev);
    }*/
    if(val.dev)
      val.dev = str_to_point(val.dev);
    val.beg = val.beg.split(",");    
    if(val.beg == "") {val.beg = [];}
    val.state = val.state;
}

function startActions(ad) {   
  
  //console.log(_.where(actions[ad], {'state':0}));
  setPos(actions[ad]); //setta le posizioni dei player e della palla
  act_ini = _.where(actions[ad], {'state':0});  //ricava le azioni iniziali (a. i.)
  act_ini.forEach(set_act_obj); //converte le proprietà delle a. i. da stringhe a tipi opportuni
  action_list = _.where(actions[ad], {'state':-1}); //ricava le azioni successive (a. s.)
  action_list.forEach(set_act_obj); //converte le proprietà delle a. s. da stringhe a tipi opportuni
  //console.log(act_ini);
  _.each(act_ini, doAction); //setta per l'esecuzione le a. i.
}

function getActions() {
  var actions_url = "https://raw.githubusercontent.com/doctorjay66/digirep/master/actionstest8a.txt";
  
  $.get(actions_url, function(result){
    //console.log(result);
    parseAction(result);
    $.each(actions, function(i, field){
      //console.log(i);
      $("div.btnStart").append('<input type="button"'+' id="'+i+'"'+' value='+'"' +i+'" />');
      $("input#"+i).click(function(){startActions(i);}) //i='act 1', 'act 2', ...
    });
    $('.btnStart').css('visibility', 'visible');
  });
  console.log(actions);
}
