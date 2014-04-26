/*
	Copyright 2014 Ivan 'MacRozz' Zarudny

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/
if (window.location.pathname === '/background.html') {
    $.ajaxSetup ({cache:false,crossDomain:true});
    if (!localStorage.Config) localStorage.Config = '{"User_Name":"Guest","token":"","Notifications":{"status":true,"online":true,"update":false,"sound_status":true,"sound":"DinDon","status":true,"follow":false},"Duration_of_stream":true,"Interval_of_Checking":3,"Format":"Grid"}';
    if (!localStorage.Status) localStorage.Status = '{"update":0,"online":0,"checked":0,"StopInterval":false}';
    if (!localStorage.FirstLaunch) localStorage.FirstLaunch='true';
    try { 
        JSON.parse(localStorage.App_Version); 
        $.getJSON('./manifest.json', function (d){
            localJSON('App_Version', 'c', ['Got', 'v.'+d.version]);
            localJSON('App_Version', 'c', ['Ver', 'v.'+d.version]);
            if (local.App_Version.Ver !== 'v.'+d.version) {
                notifyUser("Extension has been updated", "From "+local.App_Version.Ver+" to "+d.version, "ScriptUpdate", 'Upd'+Math.floor(Math.random(100)*100));
                localStorage.App_Version_Update=true;
                localStorage.App_Version_Try=0
            }
        });
    }
    catch(e) { localStorage.App_Version = '{"Ver": "v.1.3.9.4", "Got": "v.1.3.9.4"}'; localStorage.App_Version_Update=false; localStorage.App_Version_Try=0 }
    //chrome.notifications.onButtonClicked.addListener(function(id){ window.open('http://www.twitch.tv/'+NameBuffer[id.match(/\d+/)[0]]) });
    //chrome.notifications.onClosed.addListener(function(id){ chrome.notifications.clear(id,function(){})});
    //chrome.notifications.onClicked.addListener(function(id){ chrome.notifications.clear(id,function(){})});
}
function err(msg) { var d = (new Date()); console.error('['+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+']: '+msg.message ? msg.message : msg); if (msg.stack) console.debug(msg.stack); }
function log(msg) { var d = (new Date()); console.log('['+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+']: '+msg); }
function TimeNdate(d,m) { var j = [31,28,31,30,31,30,31,31,30,31,30,31]; return (new Date()).getTime()+(Math.abs(d)*86400000)+(Math.abs(m)*86400000*j[(new Date()).getMonth()]); }
function doc(id){return document.getElementById(id);}
function BadgeOnlineCount(count) { chrome.browserAction.setBadgeText({ text: String(count) })}
function Animation(id, n, f) {
    if (doc(id)) {
        var ci = $('#'+id);
        if (!n[1]) ci.show();
        if (!n[2]) n[2]=1;
        ci.css('-moz-animation', n[0]+' both '+n[2]+'s');
        setTimeout(function(){
            if (n[1]) ci.hide();
            if (typeof f === 'function') f();
        }, 1000*n[2]);
    }
}

var ncnt = 0, NameBuffer = [];
window.local = {};
var notifications = require("sdk/notifications");

function loc() {
    local.Config = JSON.parse(localStorage.Config);
    local.Status = JSON.parse(localStorage.Status);
    local.FollowingList = JSON.parse(localStorage.FollowingList);
    local.App_Version = JSON.parse(localStorage.App_Version);
}

try { loc() } catch(e) { err(e) }

setInterval(function(){
    if (typeof localStorage.ChangedBG !== 'undefined' && window.location.pathname === '/background.html') {
        try { loc(); localStorage.removeItem('ChangedBG') } catch(e) { err(e) }
    } else if (typeof localStorage.ChangedPP !== 'undefined' && window.location.pathname === '/popup.html') {
        try { loc(); localStorage.removeItem('ChangedPP') } catch(e) { err(e) }
    }
}, 100);

if (localStorage.Status&&localStorage.Config) {
    function localJSON(name,type,arrayz) {
        function chd() {localStorage.ChangedBG = 'y'; localStorage.ChangedPP = 'y'}
        try {
            var sz, b, h;
            if (name&&type=='c'&&arrayz) {
                sz = arrayz.length;
                b = local[name];
                if (sz == 2) {
                    b[arrayz[0]]=arrayz[1];
                    localStorage[name] = JSON.stringify(b);
                    chd();
                    return true;
                } else if (sz == 3) {
                    b[arrayz[0]][arrayz[1]] = arrayz[2];
                    localStorage[name] = JSON.stringify(b);
                    chd();
                    return true;
                } else {
                    return false;
                }
            } else if (name&&type=='v'&&arrayz) {
                b = local[name];
                if (arrayz.length == 1){			
                    if (b[arrayz[0]]) {return b[arrayz[0]];} else {return false;}
                } else if (arrayz.length == 2) {
                    f = b[arrayz[0]];
                    if (f[arrayz[1]]) {return f[arrayz[1]];} else {return false;}
                } else { return false; }
            } else if (name&&!type&&!arrayz) {
                return JSON.parse(localStorage[name]);
            } else { Error('[ERROR]: Wrong input in localJSON function!'); return false; }
        } catch (e) {
            err(e);
            return "ERROR";
        }
    }

    if (!localStorage.FollowingList) localStorage.FollowingList='{}';
    function FollowingList(type,id,name,stream) {
        try {
            var b, z, x;
            b = local.FollowingList;
            if (type == 'add') {
                local.FollowingList[id] = {
                    Name: name,
                    Stream: false
                };
                return localStorage.FollowingList = JSON.stringify(local.FollowingList);
            } else if (type == 'c') {
                if (stream) {
                    local.FollowingList[id].Stream = {
                        Title: stream[0],
                        Game: stream[1],
                        Viewers: stream[2],
                        Time: stream[3],
                        GameIMG: stream[4]
                    };
                } else { local.FollowingList[id].Stream = false; }
                return localStorage.FollowingList = JSON.stringify(local.FollowingList);
            }
        } catch (e) { err(e); return false; }
        return Error('Nope');
    }

    function notifyUser(streamerName, titleOfStream, type, streamer) {
        if (window.location.pathname !== '/background.html') return false;
        function delNotify(id, types) {
            var idToDel = id, times;
            if (types == 'Online') { times = 1000*15 }
            else if (types == 'Changed') { times = 1000*10 }
            else { times = 1000*20 }
            setTimeout(function(){chrome.notifications.clear(idToDel, function(){});}, times);
        }

        function sendNotify(tle, msg, strm, upd) {
            log(tle+' - '+msg);
            var g = Notification(title, {body:msg, icon:"/img/icon.png"});
            if (local.Config.Notifications.sound_status) {
                var Audio = document.createElement('audio');
                Audio.src = '/Music/' + localJSON('Config', 'v', ['Notifications', 'sound']) + '.mp3';
                Audio.autoplay = 'autoplay';
                $('body').appendTo(Audio);
                //setTimeout(function(){$('audio')[0].remove();},1000*10);
                //Audio.play()
            }
        }

        if (local.Config.Notifications.status) {
            if (type === 'Online' && local.Config.Notifications.online) {
                sendNotify(streamerName, titleOfStream, ncnt, type);
                ncnt++; NameBuffer.push(streamer);
            } else if (type === 'Changed' && local.Config.Notifications.update) {
                sendNotify(streamerName, titleOfStream, ncnt, type);
                ncnt++; NameBuffer.push(streamer);
            } else if (type === 'ScriptUpdate' && !sessionStorage.Disable_Update_Notifies) {
                sendNotify(streamerName, titleOfStream, ncnt, type);
                ncnt++; NameBuffer.push(' ');
            } else { log(streamerName+' '+titleOfStream+' :: [Was not displayed]'); }
        }
    }

    var _gaq=_gaq||[];
    _gaq.push(['_setAccount','UA-25472862-3']);
    _gaq.push(['_setCustomVar',3,'App_Version',local.App_Version.Ver,1]);
    _gaq.push(['_trackPageview']);

    (function(){var ga=document.createElement('script');ga.type='text/javascript';ga.async=true;ga.src='https://ssl.google-analytics.com/ga.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga,s)})()

}