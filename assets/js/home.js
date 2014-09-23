$(document).ready(function () {
	$('#signupBtn').click(function () {
		$("#signup-text-inner").hide();
		$(".signup-wrapper").fadeIn(500);
	});
	
	var error = false;
	
	function validateForm(check) {
		error = false;
		var data = { email: $("#signupEmail").val() }
		if (check === 'email' || check === 'all') {
			$.post("/user/validate", data).done(function(result) {
				if (result.email.length)
					$("#signupEmailDiv").removeClass('has-error').addClass('has-success');
				else {	
					$("#signupEmailDiv").removeClass('has-success').addClass('has-error');
					$("#signupError").text("That email address is in use.").css("visibility", "visible");
					error = true;
				}
			});
		}
		else if (check === 'password' || check === 'all') {
			var password = $("#signupPassword").val();
			if (password.length && password.length < 8) {
				$("#signupError").text("Your password must be at least 8 characters.").css("visibility", "visible");			
				$("#signupPasswordDiv").removeClass('has-success').addClass('has-error');
				error = true;
			} else
				$("#signupPasswordDiv").removeClass('has-error').addClass('has-success');
		}

		if (error)
			return false;
		
		$("#signupError").css("visibility", "hidden");
		return true;
	}

	$('#signupEmail').focusout(function() { validateForm('email'); });

	$('#signupPassword').focusout(function() { validateForm('password');	});

	$('#signupForm').submit(function() {
		var form = this;
		if (error)
			return false;

		var emailVal = $("#signupEmail").val();
		var userUnique = false;
		var emailSplit = emailVal.split('@');
		var username = '';
		var users = '';

		for (var i=0; i<10; i++) {
			userExt = Math.floor(Math.random() * 1000000);
			users += emailSplit[0] + userExt + ',';
		}

		var data = { username: users };
		var shouldSubmit = false;

		$.ajax({ type: 'POST', url: "/user/validate", data: data, async: false }).done(function(result) {
			if (result.username.length) {
				$("#signupUsername").val(result.username[0]);	
				shouldSubmit = true;
			}
			else
				$("#signupError").text("Unknown error. Please try again.").css("visibility", "visible");			

		});

		if (!shouldSubmit)
			return false;
	});	
});