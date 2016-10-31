angular.module('app.controllers', [])
    .run(function($rootScope, $theFramework, $cc) {
        $rootScope.deside = function(cb) {
            console.log('im here')
            cb = typeof cb == 'function' ? cb : function() {};
            if (!localStorage.getItem('serverAddress')) {
                $theFramework.go('/settings');
                console.log('go settig')
                return;
            }
            var cachedMe = localStorage.getItem('me');
            if (cachedMe) {
                console.log('zcxzxc')
                cachedMe = JSON.parse(cachedMe);
                $cc.post('/checkpassword', {
                    username: cachedMe.username,
                    password: cachedMe.password
                }).then(function(res) {
                    console.log('yyyyyy ' + res.data)
                    if (res.data === true) {
                        cb(cachedMe);
                    } else {
                        localStorage.removeItem('me');
                        $theFramework.toast('نام کاربری یا رمز عبور اشتباه است!');
                        $theFramework.go('/login');
                    }
                });
            } else {
                console.log('zcxzxxxxxc')
                $theFramework.go('/login');
            }
        }
    })
    .controller('login', function($scope, $theFramework, $http) {
        $scope.inputs = {};
        localStorage.removeItem('me');
        $scope.login = function() {
            var cachedMe = {
                username: $scope.inputs.username,
                password: $scope.inputs.password
            }
            localStorage.setItem('me', JSON.stringify(cachedMe));
            $theFramework.go('/contacts');
        }
    })
    .controller('settings', function($scope, $theFramework, $http) {
        $scope.inputs = {
            ip: localStorage.getItem('serverAddress')
        };
        $scope.inputs.ip = $scope.inputs.ip ? $scope.inputs.ip : '';
        $scope.submit = function() {
            if ($scope.inputs.ip.lastIndexOf('/') == $scope.inputs.ip.length - 1) {
                $scope.inputs.ip = $scope.inputs.ip.substr(0, $scope.inputs.ip.length - 1);
            }
            if ($scope.inputs.ip.indexOf('http://') !== 0 && $scope.inputs.ip.indexOf('https://') !== 0) {
                $theFramework.toast('ابتدای آدرس حتما باید با http یا https آغاز شود!');
            } else if ($scope.inputs.ip.lastIndexOf(':') !== 4 && $scope.inputs.ip.lastIndexOf(':') !== 5) {
                $theFramework.toast('آدرس را بدون port وارد کنید!');
            } else {
                var ip = $scope.inputs.ip;
                $http.get(ip + ':6978' + '/hi').then(function(res) {
                    localStorage.setItem('serverAddress', ip);
                    $theFramework.go('/login');
                }).catch(function() {
                    $theFramework.toast('آدرس معتبر نیست!');
                })

            }
        }
    })
    .controller('contacts', function($cc, $scope, $rootScope, $theFramework, $routeParams) {
        $scope.bars = true;
        $scope.sidebar = false;
        $scope.searchbar = false;
        $scope.searchText = '';
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

        $scope.groups = [];
        $scope.contacts = [];
        $scope.displayContacts = [];
        $scope.selectedGroup = $routeParams.group;
        $rootScope.deside(function(me) {
            $scope.me = me;
            $cc.get('/groups?username=' + me.username).then(function(res) {
                $scope.groups = res.data;
            });
            $cc.get('/contacts?group=' + $scope.selectedGroup).then(function(res) {
                $scope.contacts = res.data;
                $scope.displayContacts = res.data;
            });
        });

    })
    .controller('contact', function($cc, $scope, $rootScope, $theFramework, $routeParams) {
        $scope.groups = [];
        $scope.fields = [
            { value: 'phone', text: 'تلفن' },
            { value: 'mobile', text: 'موبایل' },
            { value: 'fax', text: 'فکس' },
            { value: 'mail', text: 'ایمیل' },
            { value: 'other', text: 'فیلد دلخواه' }
        ]
        $scope.contact = {
            name: '',
            vip: 0,
            group: null,
            details: []
        };
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
            if (!$scope.contact.group) {
                return;
            }
            $cc.post('/submit/' + action, $scope.contact).then(function(res) {
                console.log(action, res.data)
                if (res.data === false) {
                    $theFramework.toast('بروز اشکال در سرور.');
                } else {
                    $theFramework.toast('درخواست شما با موفقیت انجام شد!');
                    $theFramework.go('/group-contacts/' + $scope.contact.group);
                }
            });
        }

        $rootScope.deside(function(me) {
            $cc.get('/groups?username=' + me.username).then(function(res) {
                for (var i = 0; i < res.data.length; i++) {
                    $scope.groups.push({
                        text: res.data[i].name,
                        value: res.data[i].id
                    });
                }
            });
            $cc.get('/contacts/' + $routeParams.id).then(function(res) {
                $scope.contact = angular.extend($scope.contact, res.data);
            });
        });
    });