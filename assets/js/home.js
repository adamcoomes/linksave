$(document).ready(function () {
	$('#signupBtn').click(function () {
		$("#signup-text-inner").hide();
		$(".signin-wrapper").fadeIn(500);
	});

	var csrf = '';

	$.ajax({
		type: 'GET',
		url: '/csrfToken',
		async: false
	}).done(function(data) {
		csrf = data._csrf;
	});	

	var error = false;
	
	function validateForm(email, password, verifyPassword) {
		error = false;
		if (email) {
			var data = { email: email, _csrf: csrf };
			$.post("/api/user/validate", data).done(function(result) {
				if (!result.email.length) {
					$(".formError").text("That email address is in use.").fadeIn(200);
					error = true;
				}
			});
		}
		
		if (password) {
			if (password.length && password.length < 8) {
				$(".formError").text("Your password must be at least 8 characters.").fadeIn(200);			
				error = true;
			}
		}

		if (verifyPassword) {
			if (password != verifyPassword) {
				$(".formError").text("Passwords do not match. Try again.").fadeIn(200);
				error = true;
			}
		}

		if (error)
			return false;
		
		$(".formError").fadeOut(200);
		return true;
	}

	$("#resetForm").submit(function() {
		if (error)
			return false;

		if ($("#resetEmail")) {
			if (($("#resetEmail").val().length < 4) || ($("#resetEmail").val().indexOf('@') === '-1'))
				return false;
		}
	});	

	$('#signupEmail').focusout(function() { validateForm($('#signupEmail').val()); });

	$('.userPassword').focusout(function() { 
		var verifyPassword = '';
		if ($('#verifyPassword').length)
			verifyPassword = $('#verifyPassword').val();

		validateForm(null, $(this).val(), verifyPassword);
	});

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

		var data = { username: users, _csrf: csrf };
		var shouldSubmit = false;

		$.ajax({ type: 'POST', url: "/api/user/validate", data: data, async: false }).done(function(result) {
			if (result.username.length) {
				$("#signupUsername").val(result.username[0]);	
				shouldSubmit = true;
			}
			else
				$(".formError").text("Unknown error. Please try again.").fadeIn(200);			

		});

		if (!shouldSubmit)
			return false;
	});	
});