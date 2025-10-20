class User {
  final String id;
  final String name;
  final String email;
  final String role; // Priest or Volunteer
  final String? photoUrl;
  final String? phone;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.photoUrl,
    this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'],
      photoUrl: json['photoUrl'],
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'photoUrl': photoUrl,
      'phone': phone,
    };
  }
}
