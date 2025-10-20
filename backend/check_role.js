// Check user role in MongoDB
const userId = '68f494d39bf2434b11cb73ee';
const user = db.admins.findOne({_id: ObjectId(userId)});

if (user) {
    print('User found: ' + user.username);
    print('Role: "' + user.role + '"');
    print('isAttendance: ' + (user.isAttendance !== undefined ? user.isAttendance : 'NOT SET'));
} else {
    print('User not found');
}

print('\n--- All Super Admin variations ---');
const variations = ['Super_Admin', 'Super Admin', 'super_admin', 'superadmin', 'SUPER_ADMIN'];
variations.forEach(function(v) {
    const count = db.admins.countDocuments({role: v});
    if (count > 0) {
        print(v + ': ' + count + ' users');
    }
});
