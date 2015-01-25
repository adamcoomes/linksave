$(document).ready(function() {

	function timeSince(date) {

	    var seconds = Math.floor((new Date() - date) / 1000);

	    var interval = Math.floor(seconds / 31536000);

	    if (interval > 1) {
	        return interval + " years";
	    }
	    interval = Math.floor(seconds / 2592000);
	    if (interval > 1) {
	        return interval + " months";
	    }
	    interval = Math.floor(seconds / 86400);
	    if (interval > 1) {
	        return interval + " days";
	    }
	    interval = Math.floor(seconds / 3600);
	    if (interval > 1) {
	        return interval + " hrs";
	    }
	    interval = Math.floor(seconds / 60);
	    if (interval > 1) {
	        return interval + " mins";
	    }
	    return Math.floor(seconds) + " secs";
	}

	var csrf = '';
	$.get("/csrfToken").done(function(data) {
		csrf = data._csrf;
		updateDash();
	});

	function updateDash() {
		var data={_csrf: csrf};

		$.get('/api/user/getUserCount', data).done(function(users) {
			$("#users-today").text(users.today);
			$("#users-total").text(users.total);
		});

		$.get('/api/link/getLinkCount', data).done(function(linkNum) {
			$("#links-today").text(linkNum.today);
			$("#links-total").text(linkNum.total);
		});

		$.get('/api/link/getLatestLinks', data).done(function(links) {
			var linkHTML = '';
			links.forEach(function(link) {
				var tags = '';
				
				link.tags.forEach(function(tag) { 
					tags += '#' + tag.name + ' ';
				});

				var createdAt = new Date(link.createdAt);
				var timeAgo = timeSince(createdAt);

				linkHTML += '<div class="dash-info-row row"><div class="dash-info-left col-md-7"><span class="dash-link-title">' + link.title + '</span><br /><span class="dash-link-url"><b>' + timeAgo + '</b> - ' + link.info.url + '</span></div><div class="col-md-5 dash-info-right"><span class="dash-link-date">' + tags + '</span><br /><span class="dash-link-user">' + link.user.email + '</span></div></div>';
			});

			$("#dash-link-list").html(linkHTML);
			links = '';			
		});

		$.get('/api/user/getLatestUsers', data).done(function(users) {
			var userHTML = '';

			users.forEach(function(user) {
				var social = '';
				user.passports.forEach(function(passport) {
					if (passport.hasOwnProperty('provider')) {
						if (passport.provider === 'facebook')
							social += '<i class="fa fa-facebook-square"></i>';
					}
				});

				var createdAt = new Date(user.createdAt);
				var timeAgo = timeSince(createdAt);

				userHTML += '<div class="dash-info-row row"><div class="dash-info-left col-md-9"><span class="dash-user-email">' + user.email + '</span></div><div class="col-md-3 dash-info-right"><span class="dash-user-social">' + timeAgo + ' - ' + social + '</span></div></div>';
			});

			$("#dash-user-list").html(userHTML);
		});	

		setTimeout(function(){updateDash();},10000);	
	}	
});
