{{LICENSE_HEADER}}
if (localStorage.FirstLaunch === 'true') {
  localStorage.Following = 0;
  local.set('Status.update', 7);
  BadgeOnlineCount(' Hi ');
} else {
  BadgeOnlineCount(0);
  local.set('Status.online', 0);
  if (local.Games.length > 50) {
    localStorage.Games = '{}';
    local.init('Games');
  }
  if ($.inArray("object Object", localStorage.FollowingList) != -1) {
    localStorage.FollowingList = "{}";
    localStorage.Following = 0;
    send('refresh');
  }
  if (typeof local.FollowingList.length === 'undefined' && local.Following !== 0)
    local.set('Following', 0);
  $.each(local.FollowingList, function(i,v) {
    if (local.FollowingList.length === 0)
      return false;

    var j = {Stream: false}, k = local.FollowingList[i];
    if (typeof k.Notify === 'undefined')
      j.Notify = true;
    if (typeof k.d_name === 'undefined')
      j.d_name = k.Name;

    local.following.set(i, j);
  });
}

try {
  ga('set', 'appVersion', local.App_Version.Ver);
  ga('send', 'event', 'version', local.App_Version.Ver, 'ver');
}catch(e){};

var bck = {
  online: {
    data: [],
    get: function() {
      return this.data;
    },
    add: function(n) {
      return this.data.push(n);
    },
    del: function(n) {
      this.data = this.data.filter(function(v) { return v !== n; });
    },
    is: function(n) {
      return (this.data.indexOf(n))!==-1;
    }
  },
  check: function() {
    if (!localStorage.Following)
      localStorage.Following = 0;

    if (['','Guest',undefined].indexOf(local.Config.User_Name) !== -1) {
      if (localStorage.FollowingList !== "{}") {
        localStorage.FollowingList = "{}";
        send('refresh');
      }
      if (localStorage.FirstLaunch !== 'true') {
        local.set('Status.update', 6);
        log('Change user name!');
      }
      return false;
    }
    return true;
  },
  getList: function() {
    // Getting following list of user
    if (!bck.check())
      return;
    local.set('Status.update', 1);
    log("Checking following list");
    notify.send({title:'Status', msg:'Checking following list...', type:'update'});
    local.set('Status.update', 2);

    $.getJSON('https://api.twitch.tv/kraken/users/'+local.Config.User_Name+'/follows/channels?limit=100&offset=0')
    .fail(function(j) {
      err({message:"Can't get following list",stack:j});
      local.set('Status.update', 5);
      notify.send({title:"Error happen", msg:"Cannot update following list", type:"update"});
    })
    .done(function(j) {
      if (typeof local.FollowingList.length === 'undefined' && local.Following !== 0)
        local.set('Following', 0);
      else if (local.Following === j._total)
        return;

      log('Updating list of following channels');

      if (local.Following == 0) {
        // If new user
        $.each(j.follows, function(i,v) {
          local.following.set(v.channel.name, {
            Name: v.channel.name,
            Stream: false,
            Notify: true,
            d_name: v.channel.display_name
          });
        });
        local.set('Following', j._total);
        bck.getOnline();
      } else {
        // TODO
        local.set('Following', j._total);
        var NewJson = [];
        $.each(local.FollowingList, function(i,v) {
          var del = true;
          $.each(j.follows, function(j,k) {
            if (k.channel.name === v.Name)
              del = false;
          });
          if (!del)
            NewJson[i] = v;
        });
        local.set('FollowingList', NewJson);
        local.set('Status.online', 0);
        bck.getOnline();
      }
    });
    if (local.Status.update !== 5)
      local.set('Status.update', 0);
  },
  getOnline: function() {
    if (!bck.check())
      return;
    local.set('Status.update', 1);
    log("Checking status of streamers");
    notify.send({title:'Behold! Update!', msg:'Checking status of streamers...', type:'update'});
    local.set('Status.update', 4);
    local.set('Status.checked', 0);

    if (local.Config.token) {
      // Check token
      $.getJSON('https://api.twitch.tv/kraken/?oauth_token='+local.Config.token)
      .done(function(e) {
        if (!e.token.valid) {
          // token is invalid, inform user
          window.toShow = 777;
        }
      })
      .error(function(e) {
        throw new Error(e);
      });

      $.getJSON('https://api.twitch.tv/kraken/streams/followed?limit=100&offset=0&oauth_token='+local.Config.token)
      .done(function(d) {
        if (d._total === 0) {
          // nobody online...
          return false;
        }

        var onl = [];
        $.each(d.streams, function(i,v) {
          onl.push(v.channel.name);
        });

        return bck.checkStatus(onl, true);
      }).error(function(e) { err(e); });
    } else {
      var lst = [];
      $.each(local.FollowingList, function(i,v) {
        lst.push(v.Name);
      });
      bck.checkStatus(lst, false);
    }


    if (local.Status.update !== 5)
      local.set('Status.update', 0);
  },
  checkStatus: function(list, token) {
    $.each(list, function(i,v) {
      $.getJSON('https://api.twitch.tv/kraken/streams/'+v)
      .fail(function(d) {
        err({message:'checkStatus() ended with error', stack:d});
      })
      .done(chk)
      // looks odd, but it works :)
      .always((i == list.length-1)?(function(){
        // must be checked everything
        if (token) {
          // 'list' is already is online list
          $.each(bck.online.get(), function(i,v) {
            if (list.indexOf(v) === -1) {
              // streamer gone offline
              bck.online.del(v);
              var str = local.following.get(v);

              if (str.Notify)
                notify.send({
                  title: v+" went offline",
                  msg: "Been online for "+time(str.Stream.Time),
                  type: "offline"
                });

              local.following.set(v, {Stream: false});
              send({type:'following', data: {Name:v, Stream:false}});
            }
          });
          local.set('Status.online', list.length);
          BadgeOnlineCount(list.length);
        } else {
          var onl = 0;
          $.each(local.FollowingList, function(i,v) {
            if (v.Stream)
              onl++;
          });
          local.set('Status.online', onl);
          if (local.Status.online === 0 && bck.online.get().length !== 0)
            local.set('Status.online', bck.online.get().length);
          BadgeOnlineCount(local.Status.online);
          log('Every channel checked ('+local.Status.checked+')');
          local.set('Status.update', 0);
          timeOut.check();
          if (local.Config.Notifications.update) {
            switch (local.Status.online) {
              case 0:
                notify.send({title:'Update finished!', msg:'No one online right now :(', type:'update'}); break;
              case 1:
                notify.send({title:'Update finished!', msg:'Now online one channel', type:'update'}); break;
              default:
                notify.send({title:'Update finished!', msg:'Now online '+local.Status.online+' channels', type:'update'}); break;
            }
          }
        }
        log('Every channel checked');
        if (local.Status.update !== 5)
          local.set('Status.update', 0);
      })():function(){});
    });

    function chk(d) {
      local.set('Status.checked', '+1');

      if (d.stream) {
        // Channel is online
        var FoLi = local.following.get(d.stream.channel.name);
        if (typeof FoLi !== 'object')
          return err({message:'Could not find streamer in base, '+d.stream.channel.name});

        var Game = d.stream.channel.game,
          Status = d.stream.channel.status,
          Name   = d.stream.channel.name,
          d_name = d.stream.channel.display_name,
          Time   = d.stream.created_at;

        if (Status == null && FoLi.Stream.Title !== "")
          Status = FoLi.Stream.Title
        else if (Status == null && FoLi.Stream.Title === "")
          Status = 'Untitled stream';

        if (Game == null && FoLi.Stream.Game !== "")
          Game = FoLi.Stream.Game
        else if (Game == null && FoLi.Stream.Game === "")
          Game = 'Not playing';

        if (!FoLi.Stream && !bck.online.is(Name)) {
          if (FoLi.Notify) {
            var dd = (new Date()-new Date(Time)<60000)?' just went live!':' is live!';
            notify.send({
              name: Name,
              title: Name+dd,
              msg: Status,
              type: 'online',
              button: true
            });
          }
          bck.online.add(Name);
        }

        if (FoLi.Stream.Title !== Status && FoLi.Stream.Title !== undefined)
          notify.send({name:Name, title:d_name+' changed stream title on', msg:Status, type:'follow'});

        if (new Date(FoLi.Stream.Time) - new Date(Time) > 0)
          Time = FoLi.Stream.Time;

        local.game(Game);

        var s = {
          Name    : Name,
          d_name  : d_name,
          Stream  : {
            Title  : Status,
            Game   : Game,
            Viewers: d.stream.viewers,
            Time   : Time
          }
        };
        local.following.set(Name, s);
        send({type:'following', data:s});
      } else if (FoLi.Stream && !token) {
        // Channel went offline
        var FoLi = local.following.get[d._links.self.split('/').pop(-1)];
        if (!FoLi)
          return err('Could not find streamer in base, '+d.stream.channel.name);

        if (FoLi.Notify)
          notify.send({
            title: FoLi.Name+" went offline",
            msg: "Been online for "+time(FoLi.Stream.Time),
            type: "offline"
          });
        bck.online.del(FoLi.Name);
        local.following.set(FoLi.Name, {Stream: false});
        send({type:'following', data: {Name:FoLi.Name, Stream:false}});
      }
    }
  },
  init: function() {
    function setIntervals() {
      bck.intFollowing = setInterval(function(){bck.getList()}, 120000);
      bck.intStatus = setInterval(function(){bck.getOnline()}, 60000*local.Config.Interval_of_Checking);
      bck.getList();
    }
    if (bck.intFollowing == -1 && bck.intStatus == -1)
      setIntervals()
    else {
      clearInterval(bck.intFollowing);
      clearInterval(bck.intStatus);
      setIntervals();
    }
  },
  intFollowing: -1,
  intStatus: -1
};

bck.init();

{{MSG_PARSER_BAC_FUNC}}
