  const fetchProctorPairs = async (_page = 1, search = "") => {
    setLoading(true);
    try {
      const response = await api.get("/proctorPairs", {
        params: { search, itemsPerPage: -1 },
      });
      const allPairs: ProctorPair[] = response.data.data || [];

      // Group logic
      const groups: Record<number, ProctorPair[]> = {};
      allPairs.forEach((item) => {
        const gNum =
          item.groupNum && item.groupNum > 0 ? item.groupNum : -item.id;
        if (!groups[gNum]) {
          groups[gNum] = [];
        }
        groups[gNum].push(item);
      });

      setGroupedProctorPairs(groups);
      setTotalPages(Math.ceil(Object.keys(groups).length / 10) || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setGroupedProctorPairs({});
        setTotalPages(1);
      } else {
        console.error("ไม่สามารถดึงข้อมูลคู่ผู้คุมสอบได้", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchProctorPairs(currentPage, searchQuery);
  }, [currentPage, searchQuery]);
