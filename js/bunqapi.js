/********************************************************* MODELS *****************************************************/

/******************* User Model ****************/
var User = Backbone.Model.extend({
    url: function () {
        return 'http://assignment.bunq.com/user/' + id;
    }
});
var Users = Backbone.Collection.extend({
    model: User,
    url: "http://assignment.bunq.com/users"
});


/********************** Conversation Model ****************/
var Conversation = Backbone.Model.extend({
});
var Conversations = Backbone.Collection.extend({
    url: function () {
        return 'http://assignment.bunq.com/conversation/user/' + loggedUser.attributes.id;
    }
});


/*********************** Message Model **************************/
var Message = Backbone.Model.extend({
    url: function () {
        return 'http://assignment.bunq.com/conversation/' + selectedConversation.attributes.conversation.id + '/message/send';
    }
});
var Messages = Backbone.Collection.extend({
    model: Message,
    url: function () {
        return 'http://assignment.bunq.com/conversation/' + ((selectedConversation.attributes.conversation != null) ?
                selectedConversation.attributes.conversation.id : '0') + '/message/limited?limit=30&offset=0';
    }
});


/********************** Participants Collection ****************/
var Participants = Backbone.Collection.extend({
});


/********************** INSTANTIATE **********************/

var users = new Users();
var conversations = new Conversations();
var messages = new Messages();
var participants = new Participants();

var loggedUser = new User();
var selectedConversation = new Conversation();


/********************************************************* VIEWS ******************************************************/

/******************* Contact View ***************************/
var ContactView = Backbone.View.extend({
    className: 'contact btn',
    template: _.template($('#ContactTemplate').html()),

    render: function (){
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    // Click Event
    events: {
        "click": "loadConversations"
    },
    loadConversations: function(){
        // Set Logged User
        loggedUser.set(this.model.attributes);

        // Load User Conversations
        conversations.fetch();

        // Reset Selected Conversation View & Messages View
        selectedConversation.clear();
        messages.reset();

        // Close Contact View
        $('#ContactsCollapse').collapse('toggle');
    }
});
var ContactsView = Backbone.View.extend({
    model: users,
    el: '#ContactsView',

    initialize: function () {
        this.listenTo(this.model, 'sync', this.render);
    },
    render: function (){
        var cache = document.createDocumentFragment();
        this.model.each(function(_model){
            cache.appendChild(new ContactView({
                model: _model
            }).render().el);
        });
        this.$el.html(cache);
    }
});
var LoggedUserView = Backbone.View.extend({
    model: loggedUser,
    el: '#LoggedUserView',
    template: _.template($('#LoggedUserTemplate').html()),

    initialize: function (){
        this.listenTo(this.model, 'change', this.render);
        this.render();
    },
    render: function (){
        this.$el.html(this.template(this.model.toJSON()));
    }
});


/********************** Conversation View **************************/
var ConversationView = Backbone.View.extend({
    tagName: 'div',
    className: 'conversation btn',
    template: _.template($('#ConversationTemplate').html()),

    render: function (){
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    events: {
        "click": "loadMessages"
    },
    loadMessages: function(){
        // Set Selected Conversation
        selectedConversation.set(this.model.attributes);

        // Fetch Messages
        messages.fetch();

        // Render Participants View
        participants.set(this.model.attributes.users);
        participants.trigger("change");
    }
});
var ConversationsView = Backbone.View.extend({
    model: conversations,
    el: '#ConversationsView',

    initialize: function () {
        this.listenTo(this.model, 'sync', this.render);
    },
    render: function (){
        this.$el.empty();
        var container = document.createDocumentFragment();
        _.each(this.model.models, function(subview) {

            // Generate Conversation Name
            var conversationAttributes = subview.attributes.conversation;
            if (conversationAttributes.name == null){
                var conversationUsers = $.grep(subview.attributes.users, function(e){ return e.userid != conversationAttributes.userid; });
                var conversationUser = users.where({id: (conversationUsers.length > 0) ? conversationUsers[0].userid : '' });
                conversationAttributes.name = (conversationUser.length > 0) ? conversationUser[0].attributes.name : 'Me!';
            }

            container.insertBefore(new ConversationView({
                model: subview
            }).render().el, container.firstChild);
        });
        this.$el.append(container);

        // To update GUI after fetching the data;
        $('#ConversationsView').animate({scrollTop: 0}, 400);
    }
});
var SelectedConversationView = Backbone.View.extend({
    model: selectedConversation,
    el: '#SelectedConversationView',
    template: _.template($('#SelectedConversationTemplate').html()),

    initialize: function (){
        this.listenTo(this.model, 'change', this.render);
        this.render();
    },
    render: function (){
        this.$el.html(this.template(this.model.toJSON()));
    }
});


/*********************** Message View ********************/
var MessageView = Backbone.View.extend({
    className: 'msg',
    template: _.template($('#MessageTemplate').html()),

    render: function (){
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});
var MessagesView = Backbone.View.extend({
    model: messages,
    el: '#MessagesView',

    initialize: function () {
        this.listenTo(this.model, 'sync', this.render);
        this.listenTo(this.model, 'reset', this.render);

        this.timer = setInterval(function() {
            messages.fetch();
        }, 5000);
    },
    render: function (){
        this.$el.empty();
        var container = document.createDocumentFragment();
        _.each(this.model.models, function(subview) {
            // Generate Sender Name
            var msgUser = users.where({id: subview.attributes.senderId });
            subview.attributes.senderName = (msgUser.length > 0) ? msgUser[0].attributes.name : 'Ghost';

            container.insertBefore(new MessageView({
                model: subview
            }).render().el, container.firstChild);
        });
        this.$el.append(container);

        // To update GUI after fetching the data;
        $('#MessagesView').animate({scrollTop: $('#MessagesView').prop("scrollHeight")}, 500);
    },
    close: function() {
        clearInterval(this.timer);
    }
});


/*********************** Participant View ********************/
var ParticipantView = Backbone.View.extend({
    className: 'contact',
    template: _.template($('#ParticipantTemplate').html()),

    render: function (){
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});
var ParticipantsView = Backbone.View.extend({
    model: participants,
    el: '#ParticipantsView',

    initialize: function () {
        this.listenTo(this.model, 'change', this.render);
        this.render();
    },
    render: function (){
        this.$el.empty();
        var container = document.createDocumentFragment();
        _.each(this.model.models, function(subview) {
            // Generate Participant Name
            var participant = users.where({id: subview.attributes.userid });
            subview.attributes.participantName = (participant.length > 0) ? participant[0].attributes.name : 'Ghost';
            
            container.appendChild(new ParticipantView({
                model: subview
            }).render().el);
        });
        this.$el.append(container);
    }
});


/*************************************************** INSTANTIATE ******************************************************/
new ContactsView();
new LoggedUserView();
new ConversationsView();
new SelectedConversationView();
new MessagesView();
new ParticipantsView();

// Initialize by providing all available users (Mocking up the Login Page)
users.fetch();

/*********************************************** FUNCTIONS ************************************************************/
/* SEND MESSAGE */
function sendMessage() {
    messages.create({
        message: $('.message-text-contents').val(),
        senderId: loggedUser.id,
        timestamp: 'Just sent'
    }, {at: 0, wait: true});

    $('.message-text-contents').val('');
}