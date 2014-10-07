var Acl = function() {
    this.permissions = [];
};

Acl.prototype.allow = function(roles, resource, actions) {

    this.permissions.push({
        roles: roles,
        resourcePattern: new RegExp(resource),
        actions: actions
    });
};

Acl.prototype.isAllowed = function(role, resource, action) {

    var permission, i;
    for(i = this.permissions.length - 1; i >= 0; i--) {
        permission = this.permissions[i];
        if(permission.resourcePattern.test(resource) && permission.actions.indexOf(action) > -1) {
            return permission.roles.indexOf(role) > -1;
        }
    }

    return false;
};

module.exports = Acl;