import { createAccessControl } from "better-auth/plugins/access";

 const statement = {
    project: ["create", "share", "update", "delete"], // <-- Permissions available for created roles
} as const;

const ac = createAccessControl(statement);

 const user = ac.newRole({ 
    project: ["share"], 
}); 

 const admin = ac.newRole({ 
    project: ["create", "update", "delete", "share"], 
}); 
 const owner = ac.newRole({ 
    project: ["create", "update", "delete", "share"], 
});

 const manager = ac.newRole({ 
    project: ["create", "update","share"], 
}); 

export { ac, admin, manager, user, owner, statement };