$(document).ready(function() {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDo6ilThVghK4ctbORrJ7ujJrl6IF39VHs",
    authDomain: "uja-2048-52718.firebaseapp.com",
    databaseURL: "https://uja-2048-52718.firebaseio.com",
    projectId: "uja-2048-52718",
    storageBucket: "uja-2048-52718.appspot.com",
    messagingSenderId: "770426857642"
  };
  firebase.initializeApp(config);

  // Our database
	var db = firebase.database();
  var storage = firebase.storage();

  // Listeners
  db.ref().child('issues').on('child_added', function(snapshot) {
		addIssue(snapshot.key, snapshot.val().title, snapshot.val().description, snapshot.val().date);
	});


  /// Listen for events in the interface

  // Click of 'Create issue button'. Adds a new issue to the database
	$('#createIssue').on('click', function(e) {
		// Don't load the page again.
		e.preventDefault();

    var title = $('#titleInsertIssue').val();
    var description = $('#descriptionInsertIssue').val();
    var file = document.getElementById('imageInsertIssue').files[0];

    // Are the input values valid?
    if (title && description) {
      // Do we need to upload an image? If anyone has been chosen
      uploadIssue(title, description, file);
    } else {
      $('#errorInsertIssue').text('The title and the description of the issue cannot be empty.');
      $('.modal-dialog').effect('shake', {times: 2}, 600);
    }
	});

  // Click an item from the dropdown menu
  $(document).on('click', '.dropdown-item', function() {
    // Select the new type of sort
    $('.dropdown-item').removeClass('active');
    $(this).addClass('active');

    sortList($(this).text());
  });

  $('#imageInsertIssue').on('change', function() {
    var file = $(this).val();

    if (file) {
      var getName = file.split('\\');
      file = getName[getName.length - 1];
      $('#imageInsertIssueLabel').text(file);
    }
  });

  // Exit button or Cancel were pressed, so inputs will be cleaned as well as the error message
  $('.modal').on('click', '.close, #closeModal', function() {
    // Inputs
    $('#titleInsertIssue').val('');
    $('#descriptionInsertIssue').val('');

    // Error message
    $('#errorInsertUser').text('');
  });


  /// 'PRIVATE' METHODS
  // Add an issue to the current list
  function addIssue(key, title, description, dateTimestamp) {
    var date = new Date(dateTimestamp);
    var dateString = 'Date: ' + date.toGMTString();
    $('#issueList').append('<li id="' + key + '" class="list-group-item ml-0">' +
                            '<button class="btn btn-link m-0 p-0" data-toggle="modal" data-target="#issueInfoModal">' +
                              '<h6 class="m-0 p-0"><i class="mr-2 fas fa-exclamation-circle"></i>' + title + '</h6>' +
                            '</button>' +
                            '<p class="small text-muted m-0 p-0 pt-2 pl-4 ml-1">' + dateString + '</p>' +
                           '</li>');
  }

  // Modify the modal information when an issue is clicked
  $(document).on('click', '.list-group-item', function() {
    // Identifier of the issue we're looking for
    var issueId = $(this).attr('id');

    db.ref().child('issues/' + issueId).once('value', function(snapshot) {
      if (snapshot.val()) {
        // Show body and hide error message
        $('#bodyIssueInfo').css('display', 'block');
        $('#errorIssueInfo').css('display', 'none');

        $('#issueInfoIdentifier').text('Issue ' + issueId.replace('-', ''));
  			$('#issueInfoTitle').text(snapshot.val().title);
        $('#issueInfoDescription').text(snapshot.val().description);

        // Does this issue have an image?
        $('#imageBlock').css('display', 'none');  // By default the block with image will be hidden

        var issuesRef = storage.ref().child('issues/' + issueId + '.png');
        issuesRef.getDownloadURL().then(function(url) {
          $('#imageBlock').css('display', 'block');
          $('#issueInfoImage').attr('src', url);
        })
      } else {
        // Hide the body and show the error message
        $('#bodyIssueInfo').css('display', 'none');
        $('#errorIssueInfo').css('display', 'block');
      }
    }).catch(function(error) {
    });
  });

  // Sort list of issues
  function sortList(type) {
    var list = document.getElementById('issueList'), i, switching = true, b, shouldSwitch;

    // Loop until no switching is done
    while (switching) {
      switching = false;
      listElements = list.getElementsByTagName('li');

      // Loop through all list-items:
      for (i = 0; i < (listElements.length - 1); i++) {
        shouldSwitch = false;

        // Should we switch the rows?
        if ((type == 'Newest') &&
            (listElements[i].getElementsByTagName('p')[0].innerHTML < listElements[i + 1].getElementsByTagName('p')[0].innerHTML)) {
          shouldSwitch = true;
          break;
        } else if ((type == 'Oldest') &&
            (listElements[i].getElementsByTagName('p')[0].innerHTML > listElements[i + 1].getElementsByTagName('p')[0].innerHTML)) {
          shouldSwitch = true;
          break;
        }
      }

      if (shouldSwitch) {
        listElements[i].parentNode.insertBefore(listElements[i + 1], listElements[i]);
        switching = true;
      }
    }
  }

  function uploadIssue(title, description, file) {
    // We need a new key, for the image name and the identifier of the issue in the realtime database
    var key = db.ref('issues').push().key;

    if (file) {
      var ref = storage.ref().child('issues/' + key + '.png');

      try {
        ref.put(file).then(function() {
          uploadIssueDatabase(key, title, description);
        });
      } catch (error) {
        $('#errorInsertIssue').text('An error occurred while uploading the file, so the issue couldn\'t be uploaded either.');
      }
    } else {
      uploadIssueDatabase(key, title, description);
    }
  }

  function uploadIssueDatabase(key, title, description) {
    db.ref('issues/' + key).set({
      title: title,
      description: description,
      date: Date.now()
    });
  }
});