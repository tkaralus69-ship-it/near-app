sendBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const text = waveText.value.trim();
  if (!text) return;

  sendBtn.disabled = true;

  try {
    const u = auth.currentUser;
    if (!u) {
      alert("Not signed in yet — try again in a second");
      sendBtn.disabled = false;
      return;
    }

    await addDoc(collection(db, "waves"), {
      uid: u.uid,
      message: text,
      createdAt: serverTimestamp(),
      theme:
        document.querySelector(".vibeBtn.active")?.dataset.theme || "city"
    });

    closeModal();
  } catch (err) {
    console.error("SEND FAILED:", err);
    alert("Send failed — check console");
  } finally {
    sendBtn.disabled = false;
  }
});
