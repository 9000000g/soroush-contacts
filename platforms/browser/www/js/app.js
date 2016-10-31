function findTemplate(templateName) {
    return '/templates/' + templateName + '.html';
}

angular.module('app', ['theFramework', 'app.controllers'])
    .config(function($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: findTemplate('login'),
                controller: 'login'
            })
            .when('/group-contacts/:group?', {
                templateUrl: findTemplate('contacts'),
                controller: 'contacts'
            })
            .when('/contacts/:id', {
                templateUrl: findTemplate('contact'),
                controller: 'contact'
            })
            .when('/settings', {
                templateUrl: findTemplate('settings'),
                controller: 'settings'
            })
            .otherwise({
                redirectTo: '/group-contacts'
            });
    })
    .factory('$cc', function($http) {
        return {
            post: function(url, body) {
                return $http.post(localStorage.getItem('serverAddress') + ':6978' + url, body);
            },
            get: function(url) {
                return $http.get(localStorage.getItem('serverAddress') + ':6978' + url);
            }
        }
    })