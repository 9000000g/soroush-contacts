_sid = (function (){
    var sid = localStorage.getItem('_sid');
	if( !sid ){
        sid = '';
        var possible = "abcdefghijklmnopqrstuvwxyz";
        for( var i=0; i < 4; i++ ){
            sid += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        sid += '-' + Date.now();
        localStorage.setItem('_sid', sid);
    }
    return sid;
})();