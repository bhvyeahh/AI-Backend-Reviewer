// Simulating database with an array
let users = [
  { id: 1, name: "Bhavya", email: "bhavya@gmail.com" },
  { id: 2, name: "Riya", email: "riya@example.com" },
];

export const getAllUsers = () => users;

export const getUserById = (id) => users.find((u) => u.id === Number(id));

export const addUser = (user) => {
  user.id = users.length + 1;
  users.push(user);
  return user;
};

export const updateUser = (id, data) => {
  const index = users.findIndex((u) => u.id === Number(id));
  if (index !== -1) {
    users[index] = { ...users[index], ...data };
    return users[index];
  }
  return null;
};

export const deleteUser = (id) => {
  const index = users.findIndex((u) => u.id === Number(id));
  if (index !== -1) {
    const deleted = users[index];
    users.splice(index, 1);
    return deleted;
  }
  return null;
};
