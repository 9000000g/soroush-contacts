function findTemplate(templateName) {
    return 'templates/' + templateName + '.html';
}


var serverCheck = function($q, $http, $theFramework, settings) {
    var defer = $q.defer();
    if (!settings.get('server')) {
        defer.reject();
        $theFramework.go('/settings');
    } else {
        $http.get('http://' + settings.get('server') + ':6978/hi').then(function(res) {
            defer.resolve()
        }).catch(function() {
            defer.reject();
            $theFramework.go('/settings');
        })
    }
    return defer.promise;
}
var meResolve = function($q, $http, $theFramework, settings) {
    var defer = $q.defer();
    if (!settings.get('username') || !settings.get('password')) {
        defer.reject();
        $theFramework.go('/settings');
    } else {
        var cachedMe = {
            username: settings.get('username'),
            password: settings.get('password')
        }
        $http.post('http://' + settings.get('server') + ':6978/checkpassword', cachedMe).then(function(res) {
            if (res.data === true) {
                defer.resolve();
            } else {
                defer.reject();
                $theFramework.go('/settings');
            }
        });
    }
    return defer.promise;
}

var groupsResolve = function($q, $cc, settings) {
    var defer = $q.defer();
    var username = settings.get('username');
    $cc.get('/groups?username=' + username).then(function(res) {
        defer.resolve(res.data);
    }).catch(function() {
        defer.reject();
    });
    return defer.promise;
}

var contactsResolve = function($q, $route, $cc) {
    var group = $route.current.params.group;
    if (!group) {
        return [];
    }
    var defer = $q.defer();
    $cc.get('/contacts?group=' + group).then(function(res) {
        defer.resolve(res.data);
    }).catch(function() {
        defer.reject();
    });
    return defer.promise;
}

var contactResolve = function($q, $route, $cc) {
    var contact = $route.current.params.id;
    if (!contact) {
        return {};
    }
    var ret = {
        name: '',
        vip: 0,
        group: null,
        details: []
    };
    var defer = $q.defer();
    $cc.get('/contacts/' + contact).then(function(res) {
        defer.resolve(angular.extend(ret, res.data));
    }).catch(function() {
        defer.reject();
    });
    return defer.promise;
}

angular.module('app', ['theFramework', 'app.controllers'])
    .config(function($routeProvider) {
        $routeProvider
            .when('/group-contacts/:group?', {
                templateUrl: findTemplate('contacts'),
                controller: 'contacts',
                resolve: {
                    serverCheck: serverCheck,
                    me: meResolve,
                    groups: groupsResolve,
                    contacts: contactsResolve
                }
            })
            .when('/contacts/:id', {
                templateUrl: findTemplate('contact'),
                controller: 'contact',
                resolve: {
                    serverCheck: serverCheck,
                    me: meResolve,
                    groups: groupsResolve,
                    contact: contactResolve
                }
            })
            .when('/settings', {
                templateUrl: findTemplate('settings'),
                controller: 'settings'
            })
            .otherwise({
                redirectTo: '/group-contacts'
            });
    })
    .factory('$cc', function($http, settings) {
        return {
            post: function(url, body) {
                var port = 6978;
                if (url.indexOf(':') === 0) {
                    port = url.substr(1, 4);
                    url = url.substr(5);
                }
                var server = settings.get('server');
                if (!server) {
                    return {
                        then: function() {
                            return {
                                catch: function() {}
                            }
                        }
                    };
                }
                return $http.post('http://' + server + ':' + port + url, body, { timeout: 7000 });
            },
            get: function(url) {
                var server = settings.get('server');
                if (!server) {
                    return {
                        then: function() {
                            return {
                                catch: function() {}
                            }
                        }
                    };
                }
                return $http.get('http://' + server + ':6978' + url, { timeout: 7000 });
            }
        }
    })
    .factory('settings', function() {
        return {
            get: function(key) {
                var settings = localStorage.getItem('settings');
                if (!settings) {
                    return '';
                } else {
                    return JSON.parse(settings)[key];
                }
            },
            save: function(st) {
                localStorage.setItem('settings', JSON.stringify(angular.extend({
                    server: '',
                    username: '',
                    password: '',
                    extension: ''
                }, st)));
            }
        }
    })