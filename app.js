(function(){

  // Publicidad interna para mi persona a bajo nivel
  window['\x63\x6F\x6E\x73\x6F\x6C\x65']['\x6C\x6F\x67']('%c\x44\x65\x73\x61\x72\x72\x6F\x6C\x6C\x61\x64\x6F\x20\x70\x6F\x72\x20\x56\x69\x6E\x69\x63\x69\x6F\x20\x56\x61\x6C\x62\x75\x65\x6E\x61', '\x63\x6F\x6C\x6F\x72\x3A\x20\x67\x72\x65\x65\x6E\x3B\x20\x66\x6F\x6E\x74\x2D\x73\x69\x7A\x65\x3A\x20\x31\x36\x70\x78\x3B\x20\x66\x6F\x6E\x74\x2D\x66\x61\x6D\x69\x6C\x79\x3A\x20\x6D\x6F\x6E\x6F\x73\x70\x61\x63\x65\x3B')
  window['\x63\x6F\x6E\x73\x6F\x6C\x65']['\x6C\x6F\x67']('\x68\x74\x74\x70\x73\x3A\x2F\x2F\x77\x77\x77\x2E\x6C\x69\x6E\x6B\x65\x64\x69\x6E\x2E\x63\x6F\x6D\x2F\x69\x6E\x2F\x66\x6F\x72\x6D\x61\x74\x63\x6F\x6D')

  // dependencias de la app
  var app = angular.module('core', ['ngRoute', 'lumx'])

  // configuracion de firebase
  var _config = {
    apiKey: "[api key]",
    authDomain: "[project name].firebaseapp.com",
    databaseURL: "https://[project name].firebaseio.com",
    projectId: "[project id]",
    storageBucket: "",
    messagingSenderId: "[sender id]"
  }

  var _appdb     = firebase.initializeApp(_config)
  var _database  = firebase.database(_appdb)
  var _provider  = new firebase.auth.GoogleAuthProvider()
  var _ticketsdb = _database.ref('tickets')

  // El numero de evento se ve desde el view principal
  window['_event'] = 1

  // Menbresias soportadas
  window['_membresias'] = [
    'BRAZALETE VIP ALL ACCESS',
    'BRAZALETE VIP',
    'BRAZALETE GENERAL',
    'BRAZALETE WHITE PARTY',
    'INDIVIDUAL VIP',
    'INDIVIDUAL GENERAL',
    'UPGRADE BRAZALETE VIP',
    'CORTESIA BRAZALETE VIP',
    'CORTESIA BRAZALETE GENERAL',
    'CORTESIA VIP POR DIA',
    'CORTESIA GENERAL POR DIA',
    'CORTESIA WHITE PARTY',
    'INDIVIDUAL DE NOCHE',
    'BRAZALETE WEEKEND PASS',
    'INDIVIDUAL BOAT PARTY',
    'INDIVIDUAL ARENA ISLA BARU'
  ]

  // modulo para simplificar el uso de firebase
  app.factory('angularFire', ['$q', function($q){

    function all(ref){
      var deferred = $q.defer()
      ref.once('value', function(snapshot){
        deferred.resolve(snapshot.val())
      })

      return deferred.promise
    }

    function push(ref, obj){
      var _ref = ref.push(obj)
      return _ref.getKey()
    }

    function set(ref, pk, obj){
      ref.child(pk).set(obj)
      return pk
    }

    function get(ref, pk){
      var deferred = $q.defer()
      var _ref = ref.child(pk)

      _ref.once('value', function(snapshot){
        deferred.resolve(snapshot.val())
      })

      return deferred.promise
    }

    return {
      get: get,
      push: push,
      set: set,
      all: all
    }

  }])

  // directiva para mostrar/generar qr
  app.directive('generateQr', [function(){

    function link(scope, element, attrs){

      new QRCode(element[0], {
        width: 150,
        height: 150,
        text: attrs['text']
      })
    }

    return {
      restrict: 'A',
      link: link
    }

  }])

  // modulo de inicio de session
  app.factory('auth', ['$location', '$q', 'angularFire', function($location, $q, angularFire){

    function login(){

      var deferred = $q.defer()

      _provider.addScope('profile');
      _provider.addScope('email');

      firebase.auth().signInWithPopup(_provider)
        .then(function(resolve){
	  console.dir(resolve)
          sessionStorage.setItem('uid',  resolve.credential.accessToken);
          sessionStorage.setItem('user', resolve.user.email);
          deferred.resolve(resolve)
        })
        .catch(function(error){
          deferred.reject(error)
        })

      return deferred.promise

    }

    function get(){
      return {
        uid: sessionStorage.getItem('uid'),
	user: sessionStorage.getItem('user')
      }
    }

    function logout(){
      sessionStorage.clear()
      $location.path('/')
    }

    return {
      login:  login,
      logout: logout,
      get:    get
    }

  }])


  app.run(['$rootScope', '$location', 'LxNotificationService', 'auth', function($rootScope, $location, LxNotificationService, auth){

    $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute){

      try {


        if (nextRoute.originalPath != '/login'){

          if (nextRoute.params.id || nextRoute.access.path){
            $rootScope.nextPath = nextRoute.access.path+'/'+nextRoute.params.id
          }else{
            $rootScope.nextPath = nextRoute.originalPath
          }

        }

        var isAuthenticated = auth.get()
        if (nextRoute.access.requiredLogin && isAuthenticated.user == null){
          event.preventDefault()
          return $location.path('login')
        }


      }catch(error){}

    })

  }])


  app.config(['$routeProvider', '$httpProvider', '$locationProvider', '$sceProvider', function($routeProvider, $httpProvider, $locationProvider, $sceProvider){


    // vista de login
    $routeProvider.when('/login', {
      templateUrl: '/views/login.html',
      controller: ['$scope', '$rootScope', 'auth', '$location', function($scope, $rootScope, auth, $location){

        $scope.user = {}

        $scope.error = {}

        $scope.cleanError = function(){
          $scope.error = {}
        }

        $scope.login = function(){
            auth.login()
            .then(function(resolve){
              $location.path($rootScope.nextPath || '/')
            }, function(error){
              $scope.error.show = true
              $scope.error.message = error.message
              $scope.user.password = ''
            })
        }


      }],
      access: { requiredLogin: false }
    })

    // vista principal
    .when('/', {
      templateUrl: '/views/index.html',
      controller:  ['$scope', 'angularFire', function($scope, angularFire){

        $scope.event = String(window['_event'])

        $scope.changeEvent = function(){

          angularFire.all(
              _ticketsdb.orderByChild('_event').equalTo(parseInt($scope.event))
          ).then(function(tickets){
            var _buffer = []

            var k = Object.keys(tickets || {})
            for (x=k.length-1; x>=0 ; x--) {
              var _ticket = tickets[k[x]]
              _ticket.$id = k[x]
              _buffer.push(_ticket)
            }
            $scope.tickets = _buffer
          })
        }

        $scope.changeEvent()

      }],
      access: { requiredLogin: true }
    })

    // vista para crear ticket
    .when('/create', {
      templateUrl: '/views/create.html',
      controller: ['$scope', '$rootScope', '$location', 'auth', 'angularFire', 'LxNotificationService', function($scope, $rootScope, $location, auth, angularFire, LxNotificationService){

        var _user = auth.get()

        $scope.form = '/views/form.html'

        $scope.membresias = window['_membresias']

        $scope.create = function(){

          var ticket = $scope.ticket || {}

          ticket._user = _user
          ticket._date = moment($scope._date).format()
          ticket._event = window['_event']
          ticket.fecha = moment($scope._date).format('LL')
          var _id = angularFire.push(_ticketsdb, ticket)
          LxNotificationService.success('Ticket '+_id+' generado.');
          $location.path('/view/'+_id)

        }

      }],
      access: {
        requiredLogin: true
      }
    })

    // vista para editar
    .when('/edit/:id', {
      templateUrl: '/views/edit.html',
      controller: ['$scope', '$rootScope', '$location', '$routeParams', 'LxNotificationService', 'auth', 'angularFire', function($scope, $rootScope, $location, $routeParams, LxNotificationService, auth, angularFire){

        var _user = auth.get()

        $scope.form = '/views/form.html'

        $scope.membresias = window['_membresias']

        angularFire.get(_ticketsdb, $routeParams.id).then(function(ticket){
          if (!ticket){
            return $location.path('/')
          }

          $scope._date  = moment(ticket._date)
          $scope.ticket = ticket
        })

        $scope.update = function(){

          var ticket = $scope.ticket || {}

          ticket._user = _user
          ticket._date = moment($scope._date).format()
          ticket.fecha = moment($scope._date).format('LL')
          var _id = angularFire.set(_ticketsdb, $routeParams.id, ticket)
          LxNotificationService.success('Ticket '+_id+' actualizado.');
          $location.path('/view/'+_id)

        }

      }],
      access: {
        requiredLogin: true,
        path: '/edit'
      }
    })

    // desactivar ticket
    .when('/disable/:id', {
      template: 'Validando... Espere por favor.',
      controller: ['$rootScope', '$location', '$routeParams', 'LxNotificationService', 'auth', 'angularFire', function($rootScope, $location, $routeParams, LxNotificationService, auth, angularFire){

        var _user = auth.get()
        angularFire.get(_ticketsdb, $routeParams.id).then(function(ticket){
          if (!ticket){
            LxNotificationService.error('Ticket '+$routeParams.id+' no encontrado.')
            return $location.path('/')
          }

          ticket._user   = _user
          ticket.disable = true
          var _id = angularFire.set(_ticketsdb, $routeParams.id, ticket)
          $rootScope._access = true
          $location.path('/'+_id)

        })

      }],
      access: {
        requiredLogin: true,
        path: '/disable'
      }
    })

    // habilitar ticket
    .when('/enable/:id', {
      template: '...',
      controller: ['$rootScope', '$location', '$routeParams', 'LxNotificationService', 'auth', 'angularFire', function($rootScope, $location, $routeParams, LxNotificationService, auth, angularFire){

        var _user = auth.get()
        angularFire.get(_ticketsdb, $routeParams.id).then(function(ticket){
          if (!ticket){
            LxNotificationService.error('Ticket '+$routeParams.id+' no encontrado.')
            return $location.path('/')
          }

          ticket._user   = _user
          ticket.disable = false
          var _id = angularFire.set(_ticketsdb, $routeParams.id, ticket)
          $location.path('/view/'+_id)
          LxNotificationService.success('Ticket '+_id+' activado.');

        })

      }],
      access: {
        requiredLogin: true,
        path: '/enable'
      }
    })

    // view detalles de un ticket
    .when('/view/:id', {
      templateUrl: '/views/view.html',
      controller: ['$scope', '$location', '$routeParams', 'angularFire', function($scope, $location, $routeParams, angularFire){

        angularFire.get(_ticketsdb, $routeParams.id).then(function(ticket){
          if (!ticket){
            return $location.path('/')
          }

          ticket.$id = $routeParams.id
          $scope.ticket = ticket
        })

      }],
      access: { requiredLogin: true, path: '/view' }
    })

    // genera el "pdf" de un ticket
    .when('/pdf/:id', {
      templateUrl: '/views/ticket.html',
      controller: ['$scope', '$routeParams', 'angularFire', function($scope, $routeParams, angularFire){

        $scope.textqr = "http://rumours-9c49a.firebaseapp.com/#/"+$routeParams.id

        angularFire.get(_ticketsdb, $routeParams.id).then(function(ticket){
          if (!ticket){
            return $location.path('/')
          }
          ticket.$id = $routeParams.id
          $scope.ticket = ticket
        })

      }],
      access: { requiredLogin: true, path: '/pdf' }
    })

    // Terminar la session
    .when('/logout', {
      template: '...',
      controller: ['auth', function(auth){
        auth.logout()
      }],
      access: { requiredLogin: true }
    })

    // vista para ver el estado de una entrada al momento de leer el QR
    .when('/:id', {
      templateUrl: '/views/qr.html',
      controller: ['$scope', '$rootScope', '$location', '$routeParams', 'angularFire', function($scope, $rootScope, $location, $routeParams, angularFire){

        angularFire.get(_ticketsdb, $routeParams.id).then(function(ticket){
          if (!ticket){
            return $location.path('/')
          }
          ticket.$id = $routeParams.id
          $scope._disable = true
          if ($rootScope._access) $scope._disable = false
          $rootScope._access = false
          $scope.ticket = ticket
        })

      }],
      access: { requiredLogin: true, path: '' }
    })
    .otherwise({
      redirectTo: '/'
    })

    $sceProvider.enabled(false)

    $httpProvider.defaults.useXDomain = true
    delete $httpProvider.defaults.headers.common['X-Requested-With']

  }])

})()
