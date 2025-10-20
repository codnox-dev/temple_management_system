// Check user role_id in MongoDB
const userId = '68f494d39bf2434b11cb73ee';
const user = db.admins.findOne({_id: ObjectId(userId)});

if (user) {
    print('User found: ' + user.username);
    print('Role: "' + user.role + '"');
    print('Role ID: ' + (user.role_id !== undefined ? user.role_id : 'NOT SET'));
    print('isAttendance: ' + (user.isAttendance !== undefined ? user.isAttendance : 'NOT SET'));
} else {
    print('User not found');
}

print('\n--- All users with role_id ---');
db.admins.find({role_id: {$exists: true}}).forEach(function(u) {
    print(u.username + ' - role: "' + u.role + '" - role_id: ' + u.role_id);
});
