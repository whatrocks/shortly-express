Shortly.Router = Backbone.Router.extend({
  
  server: 'http://127.0.0.1:4568',

  initialize: function(options){
    this.$el = options.el;
  },

  routes: {
    '':       'index',
    'create': 'create'
    // 'logout': 'logout'
  },

  swapView: function(view){
    this.$el.html(view.render().el);
  },

  index: function(){
    var links = new Shortly.Links();
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  create: function(){
    this.swapView(new Shortly.createLinkView());
  }

  // logout: function(){
  //   // TODO .. trigger a logout get request
  //   console.log("trying to logout");
  //   $.get(this.server + "/logout");
  // }

});
