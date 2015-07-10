var nw = require('nw.gui');
var fs = require('fs');
var path = require('path');
var mysql = require('mysql');
var table_name;
var date_patt = new RegExp(/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/) ;
var connection; 
function exit( status ) {
    // http://kevin.vanzonneveld.net
    // +   original by: Brett Zamir (http://brettz9.blogspot.com)
    // +      input by: Paul
    // +   bugfixed by: Hyam Singer (http://www.impact-computing.com/)
    // +   improved by: Philip Peterson
    // +   bugfixed by: Brett Zamir (http://brettz9.blogspot.com)
    // %        note 1: Should be considered expirimental. Please comment on this function.
    // *     example 1: exit();
    // *     returns 1: null

    var i;

    if (typeof status === 'string') {
        alert(status);
    }

    window.addEventListener('error', function (e) {e.preventDefault();e.stopPropagation();}, false);

    var handlers = [
        'copy', 'cut', 'paste',
        'beforeunload', 'blur', 'change', 'click', 'contextmenu', 'dblclick', 'focus', 'keydown', 'keypress', 'keyup', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'resize', 'scroll',
        'DOMNodeInserted', 'DOMNodeRemoved', 'DOMNodeRemovedFromDocument', 'DOMNodeInsertedIntoDocument', 'DOMAttrModified', 'DOMCharacterDataModified', 'DOMElementNameChanged', 'DOMAttributeNameChanged', 'DOMActivate', 'DOMFocusIn', 'DOMFocusOut', 'online', 'offline', 'textInput',
        'abort', 'close', 'dragdrop', 'load', 'paint', 'reset', 'select', 'submit', 'unload'
    ];

    function stopPropagation (e) {
        e.stopPropagation();
        // e.preventDefault(); // Stop for the form controls, etc., too?
    }
    for (i=0; i < handlers.length; i++) {
        window.addEventListener(handlers[i], function (e) {stopPropagation(e);}, true);
    }

    if (window.stop) {
        window.stop();
    }

    throw '';
}
function connect()
{
    var db =document.getElementById('db').value;
    var user =document.getElementById('usr').value;
    var pwd =document.getElementById('pwd').value;
    if(!db&&!user&&!pwd)
    {
        alert('Please enter all the required values!!!');
        document.getElementById("fold_loc").style.display="none";
        
    }
    else
    {
        
            connection = mysql.createConnection({
                host     : 'localhost',
                user     : user,
                password : pwd
            });
            //.connection.connect();
            
            connection.query(' CREATE DATABASE IF NOT EXISTS '+db+";",function(err){
                 if(err)
                 {
                     alert(err);
                     document.getElementById("fold_loc").style.display="none";
                     return;
                 }
                else
                {
                    connection.query('use '+db+';');
                    document.getElementById("fold_loc").style.display="inline";
                }
            });
            
   
    }
}

var win = nw.Window.get();
var values = [];
var count;
win.isMaximized = false;
function mini()
{
    win.minimize();   
}
function maxi()
{
   if (win.isMaximized)
      win.unmaximize();
   else
      win.maximize();
}
win.on('maximize', function(){
    win.isMaximized = true;
});
win.on('unmaximize', function(){
    win.isMaximized = false;
});
function CloseWindow()
{
    win.close();   
}
function readfile()
{
   var csvPath = document.getElementById('folder_path').value;
   var ext=path.extname(csvPath);
   table_name=path.basename(csvPath);
   table_name=table_name.replace(/.csv/,'')
   console.log(table_name);
   
   if(ext!=".csv")
   {
        alert('Please Select a csv file!');     
        return;
   }
    else
    {
        IfExsists(csvPath);
           
    }
}
function CreateTable()
{
    var str="Create Table "+table_name+"(";
    for(i=0;i<count;i++)
    {
      str+=values[i]+" "+findtype(values[count+i]);
        if(i!=count-1)
            str+=","
    }
    str+=");"
    console.log(str);
    connection.query(str);
    insert_table();
}
function IfExsists(csvPath)
{
    str = "select * from "+table_name+";";
    connection.query(str,function(err){
       if(!err)
        {
            console.log(err);
            var choice = confirm("Table already exsists do you want to delete it!");
            if(choice)
            {
              connection.query('DROP TABLE '+table_name+';');
               fs.readFile(csvPath,function(err,data){
               count = FindColNo(data);
               data = data.toString(); 
               values = data.split(/[,\n]/);
               CreateTable(values);
            });      
            }
            else
            {
                alert('Rename csv file to create a table with another name!');   
            }
        }
        else
        {
           fs.readFile(csvPath,function(err,data){
           count = FindColNo(data);
           data = data.toString(); 
           values = data.split(/[,\n]/);
           CreateTable(values);
            });     
        }
    });
}

function parse_date(datestring)
{
    var parsedString="";
    var arr = [];
    arr = datestring.split("/");
    for(var i=arr.length-1;i>=0;i--)
    {
        parsedString +=arr[i];
        if(i!=0)
            parsedString+='-';
    }
    return parsedString;
}
function insert_table()
{
   j=1;
    while(1)
    {
        var str="Insert into "+table_name+" values (";
        for(var i=j*count;i<(j+1)*count;i++)
        {
            if(!values[i])
            {
                alert("Please don't enter null values!! Check your csv file!!");
                connection.query('DROP TABLE '+table_name+";");
                exit();
            }
            
            if(isNaN(values[i]))
            {
                if(date_patt.test(values[i]))
                {
                  var ins_date = parse_date(values[i])
                  str+="'"+ins_date+"'";
//                console.log(values[i]);
//                str+=values[i];
                }
                else
                {
                    str+="'"+values[i]+"'"; 
                }
            }
            else
            {
                str+=values[i]; 
            }
            if(i!=(j+1)*count-1)
                str+=","
        }
        str+=");"
        console.log(str);
        connection.query(str);
        str="";
        j++;
            if(j>values.length/count-1)
                break;
        
    }
        alert('Table Added Succesfully!!');
    
}
function findtype(x)
{
    if(!x)
    {
        alert("Null values cannot be added into the table!!");
        exit();
    }
    if(!isNaN(x))
    {
    var n = Number(x);
    if(n % 1 === 0)
      return "int";   
    else
      return "float";
  }
   else
   {  
     if(date_patt.test(x))
       {
            return("date");   
       }
           
       return("varchar("+x.length*3+")");
   }
}

function FindColNo(data)
{
    data = data.toString();
    var values= [];
    values = data.split(/[,]/);
    var count = 0;
    for(i=0;i<values.length;i++)
    {
        count++;   
        if(values[i].indexOf('\n')!=-1)
            return count;
    }
}