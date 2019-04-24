angular.module("postTodo", [])
    .controller("core", function ($scope, $http) {
        $scope.user = null;
        $scope.users = null;
        $scope.formData = {};
        $scope.signUpForm = {};
        $scope.taskForm = {};
        $scope.signInError = false;
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

        $http.get('/api/users').then(function (response) {
            if (response.data.success === true) {
                $scope.users = response.data.users;
            } else {
                console.log(response.data.err);
            }
        }, function(data) {
            console.log("error " + data);
        });

        $scope.getConnected = function() {
            $http.get('/api/connected').then(function (data) {
                if (data.data.success === false)
                    $scope.user = null;
                else {
                    $scope.user = {username: data.data.user};
                    $scope.showAccount = true;
                }
            }, function (data) {
                console.log("error: " + data.data);
            });

            $http.get('/api/users').then(function (response) {
                if (response.data.success === true) {
                    $scope.users = response.data.users;
                } else {
                    console.log(response.data.err);
                }
            }, function(data) {
                console.log("error " + data);
            });
        };

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

        $scope.signIn = function() {
            if (!$scope.formData.username || $scope.formData.username.localeCompare("") === 0) {
                $scope.signInError = true;
                $scope.error = "Enter a username";
            } else if (!$scope.formData.password || $scope.formData.password.localeCompare("") === 0) {
                $scope.signInError = true;
                $scope.error = "Enter a password";
            } else {
                $http.post("/api/login", $scope.formData).then(function (data) {
                    $scope.formData = {};
                    if (data.data.success === true) {
                        $scope.showSignIn = !$scope.showSignIn;
                        $scope.getConnected();
                    }
                    else {
                        $scope.signInError = true;
                        $scope.error = "failed to log-in";
                        console.log(data.data.err);
                    }
                }, function(data) {
                    console.log("error: " + data.data);
                    $scope.formData = {};
                });
            }
        };

        $scope.signUp = function() {
            if (!$scope.signUpForm.username || $scope.signUpForm.username.localeCompare("") === 0) {
                $scope.signUpError = true;
                $scope.error = "Enter a username";
                $scope.signUpForm = {};
            } else if (!$scope.signUpForm.password || $scope.signUpForm.password.localeCompare("") === 0) {
                $scope.signUpError = true;
                $scope.error = "Enter a password";
                $scope.signUpForm = {};
            } else if (!$scope.signUpForm.password2 || $scope.signUpForm.password2.localeCompare($scope.signUpForm.password) !== 0) {
                $scope.signUpError = true;
                $scope.error = "passwords doesn't match";
                $scope.signUpForm = {};
            } else {
                requestParam = {username: $scope.signUpForm.username, password: $scope.signUpForm.password};
                $http.post("/api/register", requestParam).then(function (data) {
                    console.log(data);
                    if (data.data.success) {
                        $scope.signUpForm = {};
                        $http.post("/api/login", requestParam).then(function (data) {
                            $scope.showSignUp = !$scope.showSignUp;
                            $scope.getConnected();
                        }, function(data) {
                            console.log("error: " + data.data);
                        });
                    } else {
                        $scope.signUpError = true;
                        $scope.error = data.data.err;
                        $scope.signUpForm = {};
                    }
                }, function (data) {
                    console.log("error: " + data.data);
                });
            }
        };

        // When submitting a new post, api requests
        $scope.createTask = function() {
            selectedDate = new Date($('#addTaskEndDate').val());
            console.log($scope.taskForm.endDate);
            if (!$scope.taskForm.title) {
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
                };
                $http.post("/api/posts", params).then(function (data) {
                    $scope.taskForm = {}; // clear the form so our user is read to enter another post
                    $scope.posts = data.data;
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

        $scope.completeTask = function(id) {
            params = {_id: id};
            $http.put("/api/complete", params).then(function(data) {
                if (data.data.success === true) {
                    $scope.posts = data.data.posts;
                } else {
                    $scope.completeError = true;
                    $scope.error = data.data.err;
                }
            }, function(data) {
                console.log("error: " + data);
            });
        };

        $scope.addAssigned = function (id) {
            if (!this.addAssign.assignedName) {
                  $scope.sharingError = true;
                  $scope.error = "Please select someone to add";
            } else {
                let params = {addAssigned: this.addAssign.assignedName, _id: id};
                $http.put("/api/addAssigned", params).then(function(response) {
                    if (response.data.success === true) {
                        $scope.posts = response.data.posts;
                    } else {
                        $scope.sharingError = true;
                        $scope.error = response.data.err;
                    }
                }, function (err) {
                     console.log("error " + err);
                });
                this.addAssign = {};
            }
        };

        $scope.removeAssigned = function(id) {
            if (!this.removeAssign.assignedName) {
                console.log("inside error");
                $scope.shareNotError = true;
                $scope.error = "please select someone to remove";
            } else {
                let params = {assignedName: this.removeAssign.assignedName, _id: id};
                console.log(params);
                $http.put("/api/removeAssigned", params).then(function(response) {
                    console.log(response);
                    if (response.data.success === true)
                        $scope.posts = response.data.posts;
                    else {
                        $scope.shareNotError = true;
                        $scope.error = response.data.err;
                    }
                }, function(err) {
                    console.log("error " + err);
                });
            }
        }
    });