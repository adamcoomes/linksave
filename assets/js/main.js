function UserLoggedIn() {
	FB.api(
		    "/me?fields=id,name,picture",
		    function (response) {
		      if (response && !response.error) {
				  $("#user-pic").css('background-image', 'url('+response.picture.data.url+')');
				  $("#user-name").html(response.name);
			      $("#not-logged-in").hide();
			      $("#logged-in").show();		  
		      }
		      else {
				  UserLoggedOut();
		      }
		    }
	);    
}

function UserLoggedOut() {
    $("#logged-in").hide();
    $("#not-logged-in").show();	
}

$(document).ready(function() {
	UserLoggedIn();
	$("#fb_login").click(function() {
		
	});
	
	$("#link-form").submit(function() {
		var linkDB = new Links();
		var link = $("#link-input").val();
		var linkInfo = new Object();
		
		linkDB.set("url", link);
		linkDB.save(null, {
			success: function(linkDB) {
				var parameters = {
					url: link,
					id: linkDB.id
				}
				$.get('/link/add', parameters, function(data) {
					console.log(data);
					//linkDB.set("title", linkInfo.title);
					//linkDB.set("favicon", linkInfo.favicon);
					//linkDB.save();
				});
			}
		});
		
		return false;
	});
	
	$("#user-logout").click(function() {
	});
	
});