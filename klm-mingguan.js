// =====================================================
// KLM MINGGUAN
// Ketua Unit → hanya lihat anggota unit sendiri
// =====================================================

console.log("KLM MINGGUAN JS READY");

let db = null;
let pengguna = null;

let anggotaSemua = [];
let anggota = [];

let dataKLM = [];

let mingguSemasa = "MINGGU 1";

let ketuaUnitLogin = null;
let unitLogin = null;


// =====================================================
// INIT
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("KLM MINGGUAN: INIT");

    db = window.supabaseClient;

    if (!db) {
        console.error("Supabase client tidak dijumpai.");

        paparStatus(
            "Supabase tidak berjaya disambungkan.",
            true
        );

        return;
    }

    binaTahun();
    tetapkanBulanSemasa();
    pasangEvent();

    // 1. Dapatkan pengguna yang login
    const berjayaLogin = await dapatkanPengguna();

    if (!berjayaLogin) {
        return;
    }

    // 2. Cari Ketua Unit berdasarkan akaun login
    const berjayaKetuaUnit = await dapatkanKetuaUnit();

    if (!berjayaKetuaUnit) {
        return;
    }

    // 3. Muat anggota unit tersebut sahaja
    await muatAnggota();

    // 4. Muat KLM minggu semasa
    await muatDataMinggu();

});


// =====================================================
// TAHUN
// =====================================================

function binaTahun() {

    const select = document.getElementById("tahun");

    if (!select) return;

    const tahunSekarang =
        new Date().getFullYear();

    select.innerHTML = "";

    for (
        let tahun = tahunSekarang - 2;
        tahun <= tahunSekarang + 2;
        tahun++
    ) {

        const option =
            document.createElement("option");

        option.value = tahun;
        option.textContent = tahun;

        if (tahun === tahunSekarang) {
            option.selected = true;
        }

        select.appendChild(option);
    }

}


// =====================================================
// BULAN
// =====================================================

function tetapkanBulanSemasa() {

    const select =
        document.getElementById("bulan");

    if (!select) return;

    const bulan =
        new Date().getMonth() + 1;

    select.value = bulan;

}


// =====================================================
// EVENT
// =====================================================

function pasangEvent() {

    // ---------------------------------------------
    // TAB MINGGU
    // ---------------------------------------------

    document
        .querySelectorAll(".week-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                async () => {

                    document
                        .querySelectorAll(".week-tab")
                        .forEach(t => {
                            t.classList.remove("active");
                        });

                    tab.classList.add("active");

                    mingguSemasa =
                        tab.dataset.minggu;

                    const text =
                        document.getElementById(
                            "mingguSemasaText"
                        );

                    if (text) {
                        text.textContent =
                            mingguSemasa;
                    }

                    await muatDataMinggu();

                }
            );

        });


    // ---------------------------------------------
    // BULAN
    // ---------------------------------------------

    const bulan =
        document.getElementById("bulan");

    if (bulan) {

        bulan.addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );

    }


    // ---------------------------------------------
    // TAHUN
    // ---------------------------------------------

    const tahun =
        document.getElementById("tahun");

    if (tahun) {

        tahun.addEventListener(
            "change",
            async () => {

                await muatDataMinggu();

            }
        );

    }


    // ---------------------------------------------
    // SIMPAN
    // ---------------------------------------------

    const btnSimpan =
        document.getElementById("btnSimpan");

    if (btnSimpan) {

        btnSimpan.addEventListener(
            "click",
            simpanMinggu
        );

    }


    // ---------------------------------------------
    // LOGOUT
    // ---------------------------------------------

    const btnLogout =
        document.getElementById("btnLogout");

    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            async () => {

                if (db) {
                    await db.auth.signOut();
                }

                window.location.href =
                    "login.html";

            }
        );

    }

}


// =====================================================
// PENGGUNA LOGIN
// =====================================================

async function dapatkanPengguna() {

    try {

        const {
            data,
            error
        } = await db.auth.getUser();

        if (error) {
            throw error;
        }

        const user = data?.user;

        if (!user) {

            console.warn(
                "Tiada pengguna login."
            );

            window.location.href =
                "login.html";

            return false;
        }

        pengguna = user;

        const nama =
            user.user_metadata?.nama ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "";

        const email =
            user.email || "";

        const namaPaparan =
            nama || email;


        // ---------------------------------------------
        // PAPAR NAMA LOGIN
        // ---------------------------------------------

        const namaPengguna =
            document.getElementById(
                "namaPengguna"
            );

        if (namaPengguna) {
            namaPengguna.textContent =
                namaPaparan;
        }


        const namaSidebar =
            document.getElementById(
                "namaPenggunaSidebar"
            );

        if (namaSidebar) {
            namaSidebar.textContent =
                namaPaparan;
        }


        console.log(
            "PENGGUNA LOGIN:",
            {
                id: user.id,
                email: email,
                nama: nama
            }
        );

        return true;

    } catch (error) {

        console.error(
            "RALAT PENGGUNA:",
            error
        );

        paparStatus(
            "Gagal mendapatkan pengguna: " +
            error.message,
            true
        );

        return false;
    }

}


// =====================================================
// DAPATKAN KETUA UNIT
// Daripada table pengguna_ketua_unit
// =====================================================

async function dapatkanKetuaUnit() {

    try {

        if (!pengguna) {
            return false;
        }


        let rekod = null;


        // =================================================
        // 1. CARI MENGGUNAKAN USER_ID
        // =================================================

        const hasilUserId =
            await db
                .from("pengguna_ketua_unit")
                .select(`
                    id,
                    user_id,
                    email,
                    nama,
                    unit,
                    role,
                    status
                `)
                .eq("user_id", pengguna.id)
                .eq("status", "Aktif")
                .maybeSingle();


        if (hasilUserId.error) {

            console.warn(
                "Carian user_id gagal:",
                hasilUserId.error
            );

        } else {

            rekod =
                hasilUserId.data;

        }


        // =================================================
        // 2. JIKA TAK JUMPA → CARI EMAIL
        // =================================================

        if (!rekod && pengguna.email) {

            const hasilEmail =
                await db
                    .from("pengguna_ketua_unit")
                    .select(`
                        id,
                        user_id,
                        email,
                        nama,
                        unit,
                        role,
                        status
                    `)
                    .eq(
                        "email",
                        pengguna.email
                    )
                    .eq(
                        "status",
                        "Aktif"
                    )
                    .maybeSingle();


            if (hasilEmail.error) {

                console.error(
                    "RALAT CARI EMAIL:",
                    hasilEmail.error
                );

            } else {

                rekod =
                    hasilEmail.data;

            }

        }


        // =================================================
        // TIADA REKOD
        // =================================================

        if (!rekod) {

            console.error(
                "AKAUN BUKAN KETUA UNIT:",
                pengguna.email
            );

            paparStatus(
                "Akaun ini tidak didaftarkan sebagai Ketua Unit.",
                true
            );

            return false;
        }


        // =================================================
        // SEMAK ROLE
        // =================================================

        if (
            rekod.role &&
            rekod.role.toLowerCase() !==
            "ketua_unit"
        ) {

            paparStatus(
                "Akaun ini bukan role Ketua Unit.",
                true
            );

            return false;
        }


        // =================================================
        // SIMPAN
        // =================================================

        ketuaUnitLogin =
            rekod.nama;

        unitLogin =
            rekod.unit;


        // =================================================
        // PAPAR
        // =================================================

        const paparKetuaUnit =
            document.getElementById(
                "paparKetuaUnit"
            );

        if (paparKetuaUnit) {

            paparKetuaUnit.textContent =
                ketuaUnitLogin || "-";

        }


        const paparUnit =
            document.getElementById(
                "paparUnit"
            );

        if (paparUnit) {

            paparUnit.textContent =
                unitLogin || "-";

        }


        const unitPengguna =
            document.getElementById(
                "unitPengguna"
            );

        if (unitPengguna) {

            unitPengguna.textContent =
                unitLogin || "-";

        }


        const unitSidebar =
            document.getElementById(
                "unitPenggunaSidebar"
            );

        if (unitSidebar) {

            unitSidebar.textContent =
                unitLogin || "-";

        }


        console.log(
            "KETUA UNIT LOGIN:",
            ketuaUnitLogin
        );

        console.log(
            "UNIT LOGIN:",
            unitLogin
        );


        return true;


    } catch (error) {

        console.error(
            "RALAT KETUA UNIT:",
            error
        );

        paparStatus(
            "Gagal mendapatkan maklumat Ketua Unit: " +
            error.message,
            true
        );

        return false;
    }

}


// =====================================================
// MUAT ANGGOTA
// HANYA UNIT KETUA UNIT LOGIN
// =====================================================

async function muatAnggota() {

    paparLoading(true);

    try {

        if (!ketuaUnitLogin || !unitLogin) {

            throw new Error(
                "Maklumat Ketua Unit / Unit tidak tersedia."
            );

        }


        // =================================================
        // AMBIL DATA ANGGOTA
        // =================================================

        const {
            data,
            error
        } = await db
            .from("Data_Anggota")
            .select(`
                noskb,
                noanggota,
                nama,
                poskhidmat,
                unit,
                ketua_unit,
                status
            `)
            .eq(
                "unit",
                unitLogin
            )
            .eq(
                "ketua_unit",
                ketuaUnitLogin
            )
            .order(
                "poskhidmat",
                {
                    ascending: true
                }
            )
            .order(
                "nama",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        anggota =
            data || [];


        anggotaSemua =
            [...anggota];


        console.log(
            "================================="
        );

        console.log(
            "KETUA UNIT:",
            ketuaUnitLogin
        );

        console.log(
            "UNIT:",
            unitLogin
        );

        console.log(
            "JUMLAH ANGGOTA:",
            anggota.length
        );

        console.log(
            "================================="
        );


        paparAnggota();


    } catch (error) {

        console.error(
            "RALAT MUAT ANGGOTA:",
            error
        );

        paparStatus(
            "Gagal memuatkan anggota: " +
            error.message,
            true
        );

    } finally {

        paparLoading(false);

    }

}


// =====================================================
// PAPAR ANGGOTA
// ASING MENGIKUT POS
// =====================================================

function paparAnggota() {

    const container =
        document.getElementById(
            "senaraiPos"
        );

    if (!container) return;


    container.innerHTML = "";


    if (!anggota.length) {

        container.innerHTML = `

            <div class="card">

                <strong>
                    Tiada anggota.
                </strong>

                <p>
                    Tiada anggota dijumpai
                    untuk Ketua Unit
                    <strong>
                        ${escapeHtml(
                            ketuaUnitLogin || ""
                        )}
                    </strong>
                    di unit
                    <strong>
                        ${escapeHtml(
                            unitLogin || ""
                        )}
                    </strong>.
                </p>

            </div>

        `;

        return;
    }


    // =================================================
    // GROUP IKUT POS
    // =================================================

    const kumpulan = {};


    anggota.forEach(a => {

        const pos =
            a.poskhidmat ||
            "POS TIDAK DITETAPKAN";


        if (!kumpulan[pos]) {
            kumpulan[pos] = [];
        }


        kumpulan[pos].push(a);

    });


    // =================================================
    // BINA TABLE SETIAP POS
    // =================================================

    Object.entries(kumpulan)
        .forEach(
            ([pos, senarai]) => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "pos-card";


                const header =
                    document.createElement(
                        "div"
                    );

                header.className =
                    "pos-header";

                header.innerHTML = `
                    <span>
                        📍
                        ${escapeHtml(pos)}
                    </span>

                    <small>
                        ${senarai.length}
                        anggota
                    </small>
                `;


                const wrapper =
                    document.createElement(
                        "div"
                    );

                wrapper.className =
                    "table-wrapper";


                const table =
                    document.createElement(
                        "table"
                    );

                table.className =
                    "klm-table";


                table.innerHTML = `

                    <thead>

                        <tr>

                            <th rowspan="2"
                                class="col-bil">
                                BIL
                            </th>

                            <th rowspan="2"
                                class="col-skb">
                                NO SKB
                            </th>

                            <th rowspan="2"
                                class="col-anggota">
                                NO ANGGOTA
                            </th>

                            <th rowspan="2"
                                class="col-nama">
                                NAMA ANGGOTA
                            </th>

                            <th rowspan="2">
                                HARI BIASA
                                <br>
                                <small>
                                    JAM
                                </small>
                            </th>

                            <th colspan="3">
                                HARI OFF
                            </th>

                            <th colspan="2">
                                HARI CUTI AM
                            </th>

                        </tr>

                        <tr>

                            <th>
                                KURANG
                                <br>
                                4 JAM
                            </th>

                            <th>
                                KURANG
                                <br>
                                8 JAM
                            </th>

                            <th>
                                LEBIH
                                <br>
                                8 JAM
                            </th>

                            <th>
                                KURANG
                                <br>
                                8 JAM
                            </th>

                            <th>
                                LEBIH
                                <br>
                                8 JAM
                            </th>

                        </tr>

                    </thead>

                    <tbody></tbody>

                `;


                const tbody =
                    table.querySelector(
                        "tbody"
                    );


                senarai.forEach(
                    (a, index) => {

                        const tr =
                            document.createElement(
                                "tr"
                            );


                        tr.dataset.noskb =
                            a.noskb;


                        tr.innerHTML = `

                            <td class="col-bil">
                                ${index + 1}
                            </td>

                            <td class="col-skb">
                                ${a.noskb ?? ""}
                            </td>

                            <td>
                                ${escapeHtml(
                                    a.noanggota || ""
                                )}
                            </td>

                            <td class="col-nama">
                                ${escapeHtml(
                                    a.nama || ""
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "hari_biasa_jam",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "off_kurang_4",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "off_kurang_8",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "off_lebih_8",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "cuti_kurang_8",
                                    a.noskb
                                )}
                            </td>

                            <td>
                                ${inputKLM(
                                    "cuti_lebih_8",
                                    a.noskb
                                )}
                            </td>

                        `;


                        tbody.appendChild(tr);

                    }
                );


                wrapper.appendChild(table);

                card.appendChild(header);

                card.appendChild(wrapper);

                container.appendChild(card);

            }
        );

}


// =====================================================
// INPUT KLM
// =====================================================

function inputKLM(field, noskb) {

    return `

        <input
            type="number"
            min="0"
            step="0.01"
            class="input-klm"
            data-field="${field}"
            data-noskb="${noskb}"
            value="0"
        >

    `;

}


// =====================================================
// MUAT DATA KLM MINGGU
// =====================================================

async function muatDataMinggu() {

    if (!anggota.length) {
        return;
    }


    const bulan =
        Number(
            document.getElementById(
                "bulan"
            ).value
        );


    const tahun =
        Number(
            document.getElementById(
                "tahun"
            ).value
        );


    paparLoading(true);


    try {

        const {
            data,
            error
        } = await db
            .from("KLM_Mingguan")
            .select("*")
            .eq(
                "bulan",
                bulan
            )
            .eq(
                "tahun",
                tahun
            )
            .eq(
                "minggu",
                mingguSemasa
            )
            .eq(
                "unit",
                unitLogin
            );


        if (error) {
            throw error;
        }


        dataKLM =
            data || [];


        console.log(
            mingguSemasa,
            "DATA KLM:",
            dataKLM.length
        );


        paparAnggota();

        isiDataKeInput();


    } catch (error) {

        console.error(
            "RALAT MUAT KLM:",
            error
        );


        paparAnggota();


        paparStatus(
            "Data KLM belum dapat dimuatkan: " +
            error.message,
            true
        );


    } finally {

        paparLoading(false);

    }

}


// =====================================================
// ISI DATA DB KE INPUT
// =====================================================

function isiDataKeInput() {

    dataKLM.forEach(row => {

        const inputs =
            document.querySelectorAll(
                `.input-klm[data-noskb="${row.noskb}"]`
            );


        inputs.forEach(input => {

            const field =
                input.dataset.field;


            if (
                row[field] !== null &&
                row[field] !== undefined
            ) {

                input.value =
                    row[field];

            }

        });

    });

}


// =====================================================
// SIMPAN MINGGU
// =====================================================

async function simpanMinggu() {

    if (!anggota.length) {

        alert(
            "Tiada anggota untuk disimpan."
        );

        return;
    }


    if (!ketuaUnitLogin || !unitLogin) {

        alert(
            "Maklumat Ketua Unit tidak tersedia."
        );

        return;
    }


    const bulan =
        Number(
            document.getElementById(
                "bulan"
            ).value
        );


    const tahun =
        Number(
            document.getElementById(
                "tahun"
            ).value
        );


    const btn =
        document.getElementById(
            "btnSimpan"
        );


    btn.disabled = true;

    btn.textContent =
        "⏳ MENYIMPAN...";


    try {

        const rows = [];


        anggota.forEach(a => {

            const inputs =
                document.querySelectorAll(
                    `.input-klm[data-noskb="${a.noskb}"]`
                );


            const values = {};


            inputs.forEach(input => {

                values[
                    input.dataset.field
                ] =
                    Number(
                        input.value || 0
                    );

            });


            rows.push({

                bulan,

                tahun,

                minggu:
                    mingguSemasa,

                unit:
                    unitLogin,

                poskhidmat:
                    a.poskhidmat,

                noskb:
                    a.noskb,

                noanggota:
                    a.noanggota,

                nama:
                    a.nama,

                hari_biasa_jam:
                    values.hari_biasa_jam || 0,

                off_kurang_4:
                    values.off_kurang_4 || 0,

                off_kurang_8:
                    values.off_kurang_8 || 0,

                off_lebih_8:
                    values.off_lebih_8 || 0,

                cuti_kurang_8:
                    values.cuti_kurang_8 || 0,

                cuti_lebih_8:
                    values.cuti_lebih_8 || 0,

                ketua_unit:
                    ketuaUnitLogin,

                updated_at:
                    new Date().toISOString()

            });

        });


        // =================================================
        // UPSERT
        // =================================================

        const {
            error
        } = await db
            .from("KLM_Mingguan")
            .upsert(
                rows,
                {
                    onConflict:
                        "bulan,tahun,minggu,noskb"
                }
            );


        if (error) {
            throw error;
        }


        paparStatus(
            `Berjaya simpan ${mingguSemasa} untuk ${unitLogin}.`
        );


        btn.textContent =
            "✅ BERJAYA DISIMPAN";


        setTimeout(() => {

            btn.textContent =
                "💾 SIMPAN MINGGU";

        }, 2000);


    } catch (error) {

        console.error(
            "RALAT SIMPAN:",
            error
        );


        paparStatus(
            "Gagal menyimpan: " +
            error.message,
            true
        );


        btn.textContent =
            "❌ GAGAL SIMPAN";


    } finally {

        btn.disabled = false;

    }

}


// =====================================================
// STATUS
// =====================================================

function paparStatus(
    message,
    error = false
) {

    const box =
        document.getElementById(
            "statusBox"
        );


    if (!box) return;


    box.textContent =
        message;


    box.classList.remove(
        "hidden",
        "error"
    );


    if (error) {
        box.classList.add("error");
    }


    setTimeout(() => {

        box.classList.add(
            "hidden"
        );

    }, 5000);

}


// =====================================================
// LOADING
// =====================================================

function paparLoading(show) {

    const box =
        document.getElementById(
            "loadingBox"
        );


    if (!box) return;


    if (show) {

        box.classList.remove(
            "hidden"
        );

    } else {

        box.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
