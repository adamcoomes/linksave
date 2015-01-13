var errors = require('custom/errors');
errors.setController('file');

module.exports = {

  /**
   * `FileController.upload()`
   *
   * Upload file(s) to the server's disk.
   */

  upload: function (req, res) {
    var user = req.user;

    if (user.id) {

      // e.g.
      // 0 => infinite
      // 240000 => 4 minutes (240,000 miliseconds)
      // etc.
      //
      // Node defaults to 2 minutes.
      res.setTimeout(0);

      var filename = req.user.id + '.jpg';

      if(req._fileparser.form.bytesExpected > 3000000){
        req.connection.destroy();
      }

      req.file('avatar').upload({

        dirname: '../../assets/images/avatars/',
        saveAs: filename,
        // You can apply a file upload limit (in bytes)
        maxBytes: 3000000
        
      }, function whenDone(err, uploadedFiles) {

        if (err)
          errors.log(err, 'uploading photo', user.id);

        var photo = '/images/avatars/' + filename;

        User.update({id: user.id}, {photo: photo}, function(updateErr, user) {
          if (updateErr) {
            errors.log(err, 'updating user photo', user.id);
            res.send('error');
          } else {
            res.redirect('/');
          }
        });
      });
    }
  }
}