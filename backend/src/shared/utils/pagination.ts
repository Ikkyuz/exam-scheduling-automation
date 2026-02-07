export const getPaginationParams = (page: number, itemsPerPage: number) => {
  const take = itemsPerPage;
  const skip = (page - 1) * itemsPerPage;
  return { skip, take };
}
