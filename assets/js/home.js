$(document).ready(function () {
	$('#signupBtn').click(function () {
		$("#signup-text-inner").hide();
		$(".signin-wrapper").fadeIn(500);
	});

	var csrf = '';

       function validateEmail(email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

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
			if (!validateEmail(email)) {
				error = true;
				$(".formError").text("That email address is in invalid.").fadeIn(200);
			} else {
			var data = { email: email, _csrf: csrf };
			$.ajax({ type: 'GET', url: "/api/user/checkEmail", data: data, async: false }).done(function(result) {
				if (result === 'exists') {
					$(".formError").text("That email address is in use.").fadeIn(200);
					error = true;
				}
			});
			}
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
		var email = $('#signupEmail').val();
		var pass = $('.userPassword').val();	

		if ((email.length < 3) || (pass.length < 4))
			return false;
	
		if ((!validateForm($('#signupEmail').val(), $('.userPassword').val())) || error)
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
