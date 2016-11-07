angular.module('app.controllers', [])
    .run(function($rootScope, $theFramework, $cc) {

    })
    .controller('settings', function($scope, $theFramework, $http, $cc, settings) {
        $scope.inputs = {
            server: settings.get('server'),
            username: settings.get('username'),
            password: settings.get('password'),
            extension: settings.get('extension')
        }


        function loading(a) {
            $scope.busy = a;
            $theFramework.loading(a);
        }
        loading(false);

        $scope.extensions = [];
        $scope.reloadExtensions = function() {
            if ($scope.inputs.username.length > 1) {
                $cc.get('/extensions?username=' + $scope.inputs.username).then(function(res) {
                    $scope.extensions = res.data;
                }).catch(function() {
                    $scope.extensions = [];
                });
            }
        }
        $scope.reloadExtensions();

        $scope.submit = function() {
            loading(true);

            function checkServer(cb) {
                $scope.inputs.server = $scope.inputs.server.toLowerCase();
                $scope.inputs.server.split('http://').join('');
                $scope.inputs.server.split('https://').join('');

                if ($scope.inputs.server.lastIndexOf('/') == $scope.inputs.server.length - 1) {
                    $scope.inputs.server = $scope.inputs.server.substr(0, $scope.inputs.server.length - 1);
                }
                if ($scope.inputs.server.indexOf(':') !== -1) {
                    $scope.inputs.server = $scope.inputs.server.substr(0, $scope.inputs.server.length - 5);
                }
                if (!$scope.inputs.server || $scope.inputs.server.length < 5) {
                    cb(false);
                } else {
                    $http.get('http://' + $scope.inputs.server + ':6978/hi').then(function(res) {
                        cb(true);
                    }).catch(function() {
                        cb(false);
                    })
                }
            }

            function checkUser(cb) {
                $scope.inputs.username = $scope.inputs.username.toLowerCase();
                if (!$scope.inputs.username || $scope.inputs.username < 4 || !$scope.inputs.password || $scope.inputs.password < 4) {
                    cb(false);
                } else {
                    $http.post('http://' + $scope.inputs.server + ':6978/checkpassword', {
                        username: $scope.inputs.username,
                        password: $scope.inputs.password
                    }).then(function(res) {
                        if (res.data === true) {
                            cb(true);
                        } else {
                            cb(false);
                        }
                    });
                }
            }
            settings.save($scope.inputs);
            checkServer(function(checked) {
                if (checked) {
                    settings.save($scope.inputs);
                    checkUser(function(checked) {
                        if (checked) {
                            settings.save($scope.inputs);
                            loading(false);
                            $theFramework.go('/group-contacts');
                        } else {
                            loading(false);
                            $theFramework.toast('نام کاربری یا رمز عبور معتبر نیست!');
                        }
                    })
                } else {
                    loading(false);
                    $theFramework.toast('آدرس سرور معتبر نیست!');
                }
            })

        }
    })
    .controller('contacts', function($cc, $scope, $timeout, $theFramework, $routeParams, settings, serverCheck, groups, contacts) {
        $scope.bars = true;
        $scope.sidebar = false;
        $scope.searchbar = false;

        $scope.searchText = '';
        $scope.busy = false;
        $scope.search = function(text) {
            if (text == '') {
                $scope.searchText = '';
                $scope.displayContacts = $scope.contacts;
                return;
            }
            text = text.toLowerCase();
            $scope.searchText = text;
            $scope.displayContacts = [];
            var c;
            var j;
            for (var i = 0; i < $scope.contacts.length; i++) {
                c = $scope.contacts[i];
                if (c.name.toLowerCase().indexOf(text) !== -1) {
                    $scope.displayContacts.push(c);
                } else {
                    for (j = 0; j < c.details.length; j++) {
                        if (c.details[j].value.toLowerCase().indexOf(text) !== -1) {
                            $scope.displayContacts.push(c);
                            break;
                        }
                    }
                }
            }
        }

        $scope.groups = groups;
        $scope.contacts = contacts;
        $scope.selectedGroup = false;
        $scope.displayContacts = contacts;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].id == $routeParams.group) {
                $scope.selectedGroup = groups[i];
                break;
            }
        }

        $scope._bottomSheet = false;
        $scope.hovered = {};
        $scope.bottomSheet = function(item) {
            $scope._bottomSheet = true;
            $scope.hovered = item;
        }

        $scope.deleteContact = function(item) {
            if ($scope.busy || !confirm('آیا از حذف این مخاطب مطمئن هستید؟')) {
                return false;
            }
            $scope.busy = true;
            $theFramework.loading(true);
            $cc.post('/submit/delete', item).then(function(res, err) {
                $theFramework.loading(false);
                $scope.busy = false;
                if (res.data === false) {
                    $theFramework.toast('بروز اشکال در سرور.');
                } else {
                    for (var i = 0; i < $scope.contacts.length; i++) {
                        if ($scope.contacts[i].id == item.id) {
                            $scope.contacts.splice(i, 1);
                        }
                    }
                    $scope.search('');
                    $scope._bottomSheet = false;
                    $theFramework.toast('درخواست شما با موفقیت انجام شد!');
                }
            });
        }


        $scope.username = settings.get('username');
        $scope.extension = settings.get('extension');
        $scope.makeCall = function(num) {
            if (!$scope.extension || !num || $scope.busy) {
                return false;
            } else {
                $theFramework.loading(true);
                $scope.busy = true;
                $cc.post(':6880/call/' + $scope.extension + '/' + num, {
                    username: settings.get('username'),
                    password: settings.get('password')
                }).then(function(res, err) {
                    $theFramework.loading(false);
                    $scope.busy = false;
                    if (res.data === false) {
                        $theFramework.toast('بروز اشکال در برقراری تماس!');
                    } else {
                        $theFramework.toast(res.data);
                    }
                }).catch(function() {
                    $theFramework.loading(false);
                    $scope.busy = false;
                    $theFramework.toast('مدت زمان انتظار به پایان رسید.');
                });
            }
        }

        $scope.conferances = [];
        $scope.addToConferance = function(num){
            if (!$scope.extension || !num || $scope.busy) {
                return false;
            } else {
                $theFramework.loading(true);
                $scope.busy = true;
                $cc.post(':6880/add-to-conferance/' + num, {
                    username: settings.get('username'),
                    password: settings.get('password')
                }).then(function(res, err) {
                    $scope.conferances.push(num);
                    $theFramework.loading(false);
                    $scope.busy = false;
                    if (res.data === false) {
                        $theFramework.toast('بروز اشکال در برقراری تماس!');
                    } else {
                        $theFramework.toast(res.data);
                    }
                }).catch(function() {
                    $theFramework.loading(false);
                    $scope.busy = false;
                    $theFramework.toast('مدت زمان انتظار به پایان رسید.');
                });
            }
        }
    })
    .controller('contact', function($cc, $scope, $rootScope, $theFramework, $routeParams, serverCheck, settings, contact, groups) {
        $scope.fields = [
            { value: 'phone', text: 'تلفن' },
            { value: 'mobile', text: 'موبایل' },
            { value: 'fax', text: 'فکس' },
            { value: 'mail', text: 'ایمیل' },
            { value: 'other', text: 'فیلد دلخواه' }
        ]
        $scope.contact = contact;
        $scope.addDetail = function() {
            $scope.contact.details.push({
                type: '',
                value: ''
            })
        }
        $scope.removeDetail = function(index) {
            $scope.contact.details.splice(index, 1);
        }

        $scope.submit = function(action) {
            if (action == 'submit') {
                if ($scope.contact.id) {
                    action = 'edit'
                } else {
                    action = 'add'
                }
            }
            $cc.post('/submit/' + action, $scope.contact).then(function(res) {
                if (res.data === false) {
                    $theFramework.toast('بروز اشکال در سرور.');
                } else {
                    $theFramework.toast('درخواست شما با موفقیت انجام شد!');
                    $theFramework.go('/group-contacts/' + $scope.contact.group);
                }
            });
        }
        $scope.username = settings.get('username');

        $scope.groups = [];
        for (var i = 0; i < groups.length; i++) {
            $scope.groups.push({
                text: groups[i].name,
                value: groups[i].id
            });
        }
    });