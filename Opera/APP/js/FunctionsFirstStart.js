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
    catch(e) { localStorage.App_Version = '{"Ver": "{{APP_VERSION_CURRENT}}", "Got": "{{APP_VERSION_CURRENT}}"}'; localStorage.App_Version_Update=false; localStorage.App_Version_Try=0 }
    chrome.notifications.onButtonClicked.addListener(function(id){ window.open('http://www.twitch.tv/'+NameBuffer[id.match(/\d+/)[0]]) });
    //chrome.notifications.onClosed.addListener(function(id){ chrome.notifications.clear(id,function(){})});
    //chrome.notifications.onClicked.addListener(function(id){ chrome.notifications.clear(id,function(){})});
}