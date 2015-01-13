$(document).ready(function() {

	var csrf = '';
	$.get("/csrfToken").done(function(data) {
		csrf = data._csrf;
	});

	function validateEmail(email) { 
	    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return re.test(email);
	}

	function makeAlertLinks() {
		$("#change-address").click(function() {
			$("#user-profile").click();
		});

		$("#resend-verify-email").click(function() {
			$.get('/api/user/resendEmail', {_csrf: csrf}).done(function(result) {
				if (result)
					swal("Sent", "We have resent the verification link. Please check your email.");
			});
		})
	}

	$('#user-photo').click(function() {
			$.get('/api/user/getProfile', {_csrf: csrf}).done(function(user) {
				var editHTML = new EJS({url: '../../templates/photo.ejs'}).render({user: user, _csrf: csrf});
				$("#main-modal-content").html(editHTML);
				$("#newphoto").change(function() {
					if (this.files[0].size > 3000000)
						$("#photo-error").show();
					else
						$("#photo-error").hide();
				});

				$("#photo-form").submit(function() {
					if ($("#photo-error").is(':visible'))
						return false;
				});
			});
	});

	makeAlertLinks();

	$("#user-profile").click(function() {

		$.get('/api/user/getProfile', {_csrf: csrf}).done(function(user) {
			var local = true;
 			user.hasFacebook = false;

 			user.passports.forEach(function(passport) {
 				if (passport.hasOwnProperty('provider')) {
 					if ((passport.provider === 'facebook') && (passport.tokens.hasOwnProperty('accessToken')))
 						user.hasFacebook = true;
 				}
 			});

			var profileHTML = new EJS({url: '../../templates/profile.ejs'}).render({user: user});
			$("#main-modal-content").html(profileHTML);

			$.get('/api/user/checkLocal', {_csrf: csrf}).done(function(res) {
				if (res === false) {
					$("#current-password").hide();
					$("#edit-password").text('Create a password');
					local = false;
				}
			});

			$("#unlink-facebook").click(function() {
				if (!local) {
					swal('Error', 'You must create a password before unlinking Facebook.', 'error');
				} else {
					var data = {provider: 'facebook', _csrf: csrf};
					$.get('/api/user/unlink', data).done(function(result) {
						if (result === 'done')
							window.location.href = '/logout';
					});
				}
			});

			$('#edit-password').click(function() {
				$("#change-password").toggle();
			});

			$('#delete-account-link').click(function() {
				$("#delete-confirm").toggle();
			});

			$('#delete-confirm-link').click(function() {
				swal({
				  title: "WAIT!",
				  text: "Deleting your account will remove ALL of your content and information. Your account CANNOT be recovered once it has been removed.",
				  type: "warning",
				  showCancelButton: true,
				  confirmButtonClass: "btn-danger",
				  confirmButtonText: "Yes, delete everything",
				  cancelButtonText: "Nevermind",
				  closeOnConfirm: false,
				  closeOnCancel: true
				},
				function(isConfirm) {
				  if (isConfirm) {
				  	var data = {confirm: true, _csrf: csrf};
				  	window.location.href = '/logout';

				  	$.ajax({ type: 'POST', url: "/api/user/remove", data: data }).done(function(result) {});
				  }
				});
			});

			$("#edit-username").focusout(function() {
				var username = $(this).val();
				if (username.length >= 3) {
					$.get('/api/user/checkUsername', {username: username, _csrf: csrf}).done(function(result) {
						if (result === 'exists')
							$("#edit-username-check").text('This username exists. Please try another.').show();
						else
							$("#edit-username-check").hide();
					});
				} else {
					$("#edit-username-check").text('Your username must be at least 3 characters long.').show();
				}
			});

			$("#edit-email").focusout(function() {
				var email = $(this).val();

				if (!validateEmail(email)) {
					$("#edit-email-check").text('Invalid email.').show();
				} else {
					$("#edit-email-check").hide();
				}

				$.get('/api/user/checkEmail', {email: email, _csrf: csrf}).done(function(result) {
					if (result === 'exists')
						$("#edit-email-check").text('This email exists. Please try another.').show();
					else
						$("#edit-email-check").hide();
				});
			});

			$("#profile-edit-form").submit(function(e) {
				e.preventDefault();
				
				var user = new Object();
				user.name = $('#edit-name').val();
				user.username = $('#edit-username').val();
				user.email = $('#edit-email').val();
				user.about = $('#edit-about').val();
				if ($("#change-password").css('display') != 'none') {
					if ($('#edit-newpass').val().length < 8){
						$("#edit-password-check").text('Your new password must be at least 8 characters.').show();
						return false;
					}
					else if ($('#edit-newpass').val() != $('#edit-newpass-verify').val()) {
						$("#edit-password-check").text('Your verification password does not match').show();
						return false;
					}
					else {
						if (local === true) {
							if ($("#edit-curpass").val().length < 8) {
								$("#edit-password-check").text('Your password is invalid').show();
								return false;
							} else {
								user.password = $('#edit-curpass').val();
							}
						}

						$("#edit-password-check").hide();
						user.newpassword = $('#edit-newpass').val();
					}
				}

				$.post('/api/user/updateProfile', {user: user, _csrf: csrf}).done(function(result) {
					if (result === 'password-error') {
						swal("Error", "Your password was incorrect.", "error");
					} else {
						if (result != 'error') {
							$("#main-modal").modal('hide');
							if (result === 'unverified') {
								if (!$(".alert").length) {
									var alertHTML = new EJS({url: '../../templates/alert.ejs'}).render({user: user});
									$("#alert-area").html(alertHTML);
									$("#alert-close").hide();
									$(".alert").alert().show();
									makeAlertLinks();
								}
							}

							if (user.name)
								$("#user-name").text(user.name);
							else
								$("#user-name").text(user.email);
						}
						else
							swal("Error", "Your profile could not be updated.", "error");
					}
				});
			});

		});
	});
});