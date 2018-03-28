//crea l'azione per settare la posizione dei player
function pos(pl) {
  var mesh = "", beg = "", state = "CLONE", type = "";
  
  mesh = pl[6];
  if(mesh.substring(mesh.length-1) == "i") {
    beg = true;
    mesh = mesh.substring(0, mesh.length-1);
  }
  if(mesh == "p1") {    
    state = "MAIN";
  }
  if(mesh.substring(mesh.length-1) == "a") {
    type = "a";
  }
  actions[act_id]["p_"+pos_id++]={"mesh":mesh, "to":pl[9], "beg":beg, "state":state, "type":type,"id":-1};
}

function insAct(pl, ap) {
  actions[act_id]["a_"+act_i] = {"mesh":pl[6], "id":act_i, "to":pl[9]=="null"?null:pl[9], "hd":pl[10], "beg":pl[11]==" -1"?"":pl[11].trim()};
  if(_.indexOf(["sav","gllc"], pl[8]) != -1){actions[act_id]["a_"+act_i].to = pl[8];}
  _.extend(actions[act_id]["a_"+act_i], ap);
  act_i++;
}

/*****************
*crea l'oggetto che rappresenta le azioni dalla riga di testo parsata pl
*è una funzione che va da una stringa a {'act_id':{'a_1':{'type':...}}}
*act_id viene presa dalla stringa "gol bol1 juv0" e diventa bol1juv0
*/
function setActions(pl) {
  var ap={'state':-1};
  
  if(pl[1] == "gol") {
    console.log(pl[4]+pl[5]+pl[7]+pl[8]);
    act_id = pl[6]+pl[8];
    actions[act_id] = {};
  } else if(pl[1] == "pos") {
     pos(pl);
  } else if(pl[1] == "crs") {    
    //console.log(pl[2].substring(0,1));
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "crossr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "crossl";
    }
    if(pl[2].indexOf("d") != -1) {
      ap['dev'] = pl[4];
    }
    if(pl[2].indexOf(INI_ACT) != -1) {
      ap['state'] = 0;
    }
    insAct(pl, ap);
  } else if(pl[1] == "run") {
    ap['type'] = pl[1];
    if(pl[2]){ap['state'] = 0;}
    insAct(pl, ap);
  } else if(pl[1] == "rnb") {
    ap['type'] = pl[1];
    if(pl[2]){ap['state'] = 0;}
    insAct(pl, ap);
  } else if(pl[1] == "jhs") {
    ap['type'] = pl[1];
    if(pl[2] && pl[2].substring(0,1) == "d") {
      ap['drop'] = true;
    }
    insAct(pl, ap);
  } else if(pl[1] == "hds") {
    ap['type'] = pl[1];
    if(pl[2] && pl[2].substring(0,1) == "d") {
      ap['drop'] = true;
    }
    insAct(pl, ap);
  } else if(pl[1] == "dhs") {
    ap['type'] = pl[1];
    insAct(pl, ap);
  } else if(pl[1] == "pas") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "pasr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "pasl";
    }
    if(pl[2].substring(1,2) == INI_ACT) {
      ap['state'] = 0;
    }
    insAct(pl, ap);
  } else if(pl[1] == "idl") {
    ap['type'] = pl[1];
    if(pl[2] && pl[2].substring(0,1) == "d") {
      ap['drop'] = true;
    }
    insAct(pl, ap);
  } else if(pl[1] == "rns") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "rnsr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "rnsl";
    }
    insAct(pl, ap);
  } else if(pl[1] == "sav") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "savr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "savl";
    }
    insAct(pl, ap);
  } else if(pl[1] == "sft") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "sftr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "sftrl";
    }
    insAct(pl, ap);
  } else if(pl[1] == "sld") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "sldr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "sldl";
    }
    if(pl[2] && pl[2].indexOf("d") != -1) {
      ap['drop'] = true;
    }
    insAct(pl, ap);
  } else if(pl[1] == "sht") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "shtr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "shtl";
    }
    if(pl[2].indexOf(INI_ACT) != -1) {
      ap['state'] = 0;
    }
    insAct(pl, ap);
  } else if(pl[1] == "tsh") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "tshr";
    } else if(pl[2].substring(0,1) == "l") {
      ap['type'] = "tshl";
    }
    insAct(pl, ap);
  } else if(pl[1] == "bkh") {
    if(pl[2].substring(0,1) == "r") {
      ap['type'] = "bkhr";
    }
    insAct(pl, ap);
  }
}

function parseAction(a_txt) {
  var a_lines = a_txt.split("\n"), parsed_line,
                   //1                              2                     3            4        5      6           7
      //1=cmd, 2=dev. point, 3=player, 4=3° tok act. title, 5=dest. point, 6=h. dest., 7=act. succ.
      parse_l=/^([a-z]{3})([lrdi]{1,3})?(\s)(-?\d+,-?\d+,-?\d+)?(\s)?(\w{2,4})(\s)(\w{2,4})?(\d+,\d+)?(\w)?(\s-?\d,?\d?,?\d?)?$/;
  
  _.each(a_lines, function(l){
      if(l) {        
        console.log(l);
        parsed_line = parse_l.exec(l);
        console.log(parsed_line);
        setActions(parsed_line);
      }
  });
}
