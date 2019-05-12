// Create the postTodo module
angular.module("postTodo", [])
    .controller("core", function ($scope, $http) { //creating new controllers
        // init all variables that we need
        $scope.user = null;
        $scope.users = null;
        $scope.formData = {};
        $scope.signUpForm = {};
        $scope.taskForm = {};
        $scope.signInError = false; // This boolean are used for hiding or showing some content
        $scope.signUpError = false;
        $scope.showSignIn = false;
        $scope.showSignUp = false;
        $scope.showAccout = false;
        $scope.showAddTask = false;
        $scope.addTaskError = false;
        $scope.completeError = false;
        $scope.taskForm.endDate = new Date();
        $scope.addAssign =  {};
        $scope.removeAssign = {};

        // When landing on the page, get all posts and show them
        $http.get('/api/posts').then(function(data) {
            $scope.posts = data.data;
            $scope.getConnected();
        }, function(data) {
            console.log("error " + data);
        });
        //Api call for getting all users
        $http.get('/api/users').then(function (response) {
            if (response.data.success === true) {
                $scope.users = response.data.users;
            } else {
                console.log(response.data.err);
            }
        }, function(data) {
            console.log("error " + data);
        });

        //Getting the user session
        $scope.getConnected = function() {
            $http.get('/api/connected').then(function (data) { // get the user
                if (data.data.success === false)
                    $scope.user = null;
                else {
                    $scope.user = {username: data.data.user};
                    $scope.showAccount = true;
                }
            }, function (data) {
                console.log("error: " + data.data);
            });

            $http.get('/api/users').then(function (response) { // getting all the user
                if (response.data.success === true) {
                    $scope.users = response.data.users;
                } else {
                    console.log(response.data.err);
                }
            }, function(data) {
                console.log("error " + data);
            });
        };

        //Logout
        $scope.disconnect = function() {
            $scope.showAddTask = false;
            $http.get("/api/logout").then(function (data) {
               if (data.data.success === true) {
                   $scope.user = null;
                   $scope.showAccount = false;
               }
            }, function(data) {
                console.log("error: " + data.data);
            });
        };

        //Sigin function
        $scope.signIn = function() {
            if (!$scope.formData.username || $scope.formData.username.localeCompare("") === 0) { // Printing an error if we have an empty username 
                $scope.signInError = true;
                $scope.error = "Enter a username";
            } else if (!$scope.formData.password || $scope.formData.password.localeCompare("") === 0) {// Printing an error if we have an empty  password
                $scope.signInError = true;
                $scope.error = "Enter a password";
            } else {
                $http.post("/api/login", $scope.formData).then(function (data) {// Connecting
                    $scope.formData = {};// clear the form 
                    if (data.data.success === true) {//Connection succed
                        $scope.showSignIn = !$scope.showSignIn;
                        $scope.getConnected();
                    }
                    else { //Connection failed
                        $scope.signInError = true;
                        $scope.error = "failed to log-in";
                        console.log(data.data.err);
                    }
                }, function(data) { //Error
                    console.log("error: " + data.data);
                    $scope.formData = {};// clear the form
                });
            }
        };

        //Sign up function 
        $scope.signUp = function() {
            if (!$scope.signUpForm.username || $scope.signUpForm.username.localeCompare("") === 0) {// Printing an error if we have an empty username 
                $scope.signUpError = true;
                $scope.error = "Enter a username";
                $scope.signUpForm = {};// clear the form
            } else if (!$scope.signUpForm.password || $scope.signUpForm.password.localeCompare("") === 0) {// Printing an error if we have an empty password
                $scope.signUpError = true;
                $scope.error = "Enter a password";
                $scope.signUpForm = {};
            } else if (!$scope.signUpForm.password2 || $scope.signUpForm.password2.localeCompare($scope.signUpForm.password) !== 0) {// Printing an error if we have an empty password or different from the first one
                $scope.signUpError = true;
                $scope.error = "passwords doesn't match";
                $scope.signUpForm = {};
            } else {
                requestParam = {username: $scope.signUpForm.username, password: $scope.signUpForm.password};
                $http.post("/api/register", requestParam).then(function (data) {//Sending a request for registering the new user
                    console.log(data);
                    if (data.data.success) {//Success
                        $scope.signUpForm = {};
                        $http.post("/api/login", requestParam).then(function (data) {
                            $scope.showSignUp = !$scope.showSignUp;
                            $scope.getConnected();
                        }, function(data) {
                            console.log("error: " + data.data);
                        });
                    } else {//Failed
                        $scope.signUpError = true;
                        $scope.error = data.data.err;
                        $scope.signUpForm = {};
                    }
                }, function (data) { //Error
                    console.log("error: " + data.data);
                });
            }
        };

        // When submitting a new post, api requests
        $scope.createTask = function() {
            selectedDate = new Date($('#addTaskEndDate').val());
            if (!$scope.taskForm.title) {// Printing an error if we have an empty Title
                $scope.addTaskError = true;
                $scope.error = "Enter a title";
                $scope.taskForm = {};
            } else if (!$scope.taskForm.body) {
                $scope.addTaskError = true;
                $scope.error = "Enter a body";
                $scope.taskForm = {};
            } else if (!$scope.taskForm.level) {
                $scope.addTaskError = true;
                $scope.error = "Enter a level";
                $scope.taskForm = {};
            } else if (!selectedDate) {
                $scope.addTaskError = true;
                $scope.error = "Enter an end date";
                $scope.taskForm = {};
            } else {
                params = {
                    title: $scope.taskForm.title,
                    body: $scope.taskForm.body,
                    level: $scope.taskForm.level,
                    endDate: selectedDate
                };  //Creating JSON with parameters
                $http.post("/api/posts", params).then(function (data) { // Create a post and getting all posts
                    $scope.taskForm = {}; // clear the form so our user is ready to enter another post
                    $scope.posts = data.data; // Updating variable posts
                }, function (data) {
                    console.log("error: " + data);
                });
            }
        };

        // When deleting a post after checking it
        $scope.deletePost = function (id) {
            $http.delete("/api/posts/" + id).then(function(data) {
                $scope.posts = data;
            }, function(data) {
                console.log("error: " + data);
            });
        };

        //Changing the state of a task
        $scope.completeTask = function(id) {
            params = {_id: id};  //Creating JSON with parameters
            $http.put("/api/complete", params).then(function(data) { // Change state to complete in database
                if (data.data.success === true) {
                    $scope.posts = data.data.posts; // Updating posts
                } else {
                    $scope.completeError = true;
                    $scope.error = data.data.err;
                }
            }, function(data) { //Error
                console.log("error: " + data);
            });
        };

        //Adding a new user to a task
        $scope.addAssigned = function (id) {
            if (!this.addAssign.assignedName) { //Empty input verification
                  $scope.sharingError = true;
                  $scope.error = "Please select someone to add";
            } else {
                let params = {addAssigned: this.addAssign.assignedName, _id: id}; //Creating JSON with parameters
                $http.put("/api/addAssigned", params).then(function(response) { //Request for adding a use to a task
                    if (response.data.success === true) {// Success
                        $scope.posts = response.data.posts;
                    } else {//Failed
                        $scope.sharingError = true;
                        $scope.error = response.data.err;
                    }
                }, function (err) { //Error
                     console.log("error " + err);
                });
                this.addAssign = {};//Clear form
            }
        };

        //Remove an assigned to a task function
        $scope.removeAssigned = function(id) {
            if (!this.removeAssign.assignedName) { //Empty name
                $scope.shareNotError = true;
                $scope.error = "please select someone to remove";
            } else {
                let params = {assignedName: this.removeAssign.assignedName, _id: id};  //Creating JSON with parameters
                $http.put("/api/removeAssigned", params).then(function(response) {//Request for removing a user from a Task
                    if (response.data.success === true) //Success
                        $scope.posts = response.data.posts;
                    else { //Failed
                        $scope.shareNotError = true;
                        $scope.error = response.data.err;
                    }
                }, function(err) { //Error
                    console.log("error " + err);
                });
            }
        }
    });