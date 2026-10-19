
export interface District {
    name: string;
    tehsils: string[];
}

export interface Province {
    name: string;
    districts: District[];
}

export const PAKISTAN_DATA: Province[] = [
    {
        name: "Punjab",
        districts: [
            { name: "Lahore", tehsils: ["Lahore City", "Lahore Cantt", "Model Town", "Raiwind", "Shalimar", "Nishter", "Gulberg", "Wagah", "Allama Iqbal", "Ravi", "Samanabad", "Data Gunj Buksh"] },
            { name: "Faisalabad", tehsils: ["Faisalabad City", "Faisalabad Sadar", "Chak Jhumra", "Jaranwala", "Sammundri", "Tandlianwala", "Painsra", "Dijkot"] },
            { name: "Rawalpindi", tehsils: ["Rawalpindi", "Gujar Khan", "Kahuta", "Kotli Sattian", "Taxila", "Kallar Syedan", "Daultala"] },
            { name: "Multan", tehsils: ["Multan City", "Multan Sadar", "Jalalpur Pirwala", "Shujabad", "Makhdoom Rasheed"] },
            { name: "Gujranwala", tehsils: ["Gujranwala City", "Gujranwala Sadar", "Nowshera Virkan", "Kamoke", "Qila Didar Singh"] },
            { name: "Sargodha", tehsils: ["Sargodha", "Bhalwal", "Sahiwal", "Shahpur", "Sillanwali", "Kot Momin", "Bhera", "Lalliani"] },
            { name: "Bahawalpur", tehsils: ["Bahawalpur City", "Bahawalpur Sadar", "Ahmedpur East", "Hasilpur", "Khairpur Tamewali", "Yazman", "Khairpur Tamewali"] },
            { name: "Sialkot", tehsils: ["Sialkot", "Daska", "Pasrur", "Sambrial"] },
            { name: "Sahiwal", tehsils: ["Sahiwal", "Chichawatni"] },
            { name: "Sheikhupura", tehsils: ["Sheikhupura", "Ferozewala", "Muridke", "Safdarabad", "Sharakpur"] },
            { name: "Rahim Yar Khan", tehsils: ["Rahim Yar Khan", "Khanpur", "Liaquatpur", "Sadiqabad"] },
            { name: "Gujrat", tehsils: ["Gujrat", "Kharian", "Sarai Alamgir", "Jalalpur Jattan", "Kunjah"] },
            { name: "Okara", tehsils: ["Okara", "Depalpur", "Renala Khurd"] },
            { name: "Kasur", tehsils: ["Kasur", "Chunian", "Pattoki", "Kot Radha Kishan"] },
            { name: "Dera Ghazi Khan", tehsils: ["D.G. Khan", "Kot Chutta"] },
            { name: "Jhang", tehsils: ["Jhang", "Shorkot", "Ahmadpur Sial", "18-Hazari"] },
            { name: "Khanewal", tehsils: ["Khanewal", "Kabirwala", "Mian Channu", "Jahanian"] },
            { name: "Muzaffargarh", tehsils: ["Muzaffargarh", "Alipur", "Jatoi"] },
            { name: "Attock", tehsils: ["Attock", "Fateh Jang", "Pindi Gheb", "Jand", "Hassan Abdal", "Hazro"] },
            { name: "Chakwal", tehsils: ["Chakwal", "Choa Saidan Shah", "Kallar Kahar"] },
            { name: "Mianwali", tehsils: ["Mianwali", "Isakhel", "Piplan"] },
            { name: "Toba Tek Singh", tehsils: ["Toba Tek Singh", "Gojra", "Kamalia", "Pir Mahal"] },
            { name: "Vehari", tehsils: ["Vehari", "Burewala", "Mailsi"] },
            { name: "Jhelum", tehsils: ["Jhelum", "Dina", "Sohawa", "Pind Dadan Khan"] },
            { name: "Hafizabad", tehsils: ["Hafizabad", "Pindi Bhattian"] },
            { name: "Mandi Bahauddin", tehsils: ["Mandi Bahauddin", "Phalia", "Malakwal"] },
            { name: "Narowal", tehsils: ["Narowal", "Shakargarh", "Zafarwal"] },
            { name: "Nankana Sahib", tehsils: ["Nankana Sahib", "Sangla Hill", "Shah Kot"] },
            { name: "Pakpattan", tehsils: ["Pakpattan", "Arifwala"] },
            { name: "Rajanpur", tehsils: ["Rajanpur", "Jampur", "Rojhan"] },
            { name: "Layyah", tehsils: ["Layyah", "Choubara", "Karor Lal Esan"] },
            { name: "Bahawalnagar", tehsils: ["Bahawalnagar", "Chishtian", "Fort Abbas", "Haroonabad", "Minchinabad"] },
            { name: "Bhakkar", tehsils: ["Bhakkar", "Darya Khan", "Kaloorkot", "Mankera"] },
            { name: "Khushab", tehsils: ["Khushab", "Noorpur Thal", "Quaidabad", "Naushahra"] },
            { name: "Lodhran", tehsils: ["Lodhran", "Duniyapur", "Karor Pacca"] },
            { name: "Chiniot", tehsils: ["Chiniot", "Bhowana", "Lalian"] },
            // New Districts 2022
            { name: "Murree", tehsils: ["Murree", "Kotli Sattian"] },
            { name: "Talagang", tehsils: ["Talagang", "Lava"] },
            { name: "Wazirabad", tehsils: ["Wazirabad", "Ali Pur Chatta"] },
            { name: "Kot Addu", tehsils: ["Kot Addu", "Chowk Sarwar Shaheed"] },
            { name: "Taunsa", tehsils: ["Taunsa", "Koh-e-Suleman"] }
        ]
    },
    {
        name: "Sindh",
        districts: [
            { name: "Karachi Central", tehsils: ["Gulberg", "Liaquatabad", "Nazimabad", "North Nazimabad", "New Karachi"] },
            { name: "Karachi East", tehsils: ["Gulshan-e-Iqbal", "Jamshed Quarters", "Ferozabad", "Gulzar-e-Hijri", "Korangi Creek"] },
            { name: "Karachi South", tehsils: ["Saddar", "Lyari", "Garden", "Aram Bagh", "Civil Line"] },
            { name: "Karachi West", tehsils: ["Orangi", "Manghopir", "Mominabad", "Surjani", "Ittehad Town"] },
            { name: "Korangi", tehsils: ["Korangi", "Landhi", "Shah Faisal", "Model Colony"] },
            { name: "Malir", tehsils: ["Bin Qasim", "Ibrahim Hyderi", "Gadap", "Shah Murad", "Memon Goth"] },
            { name: "Keamari", tehsils: ["Baldia", "Sait", "Keamari", "Mauripur"] },
            { name: "Hyderabad", tehsils: ["Hyderabad City", "Hyderabad Sadar", "Latifabad", "Qasimabad", "Tando Jam"] },
            { name: "Sukkur", tehsils: ["Sukkur", "New Sukkur", "Rohri", "Pano Akil", "Saleh Pat"] },
            { name: "Larkana", tehsils: ["Larkana", "Ratodero", "Dokri", "Bakrani"] },
            { name: "Mirpur Khas", tehsils: ["Mirpur Khas", "Digri", "Kot Ghulam Muhammad", "Sindhri", "Jhuddo", "Shuja Abad"] },
            { name: "Nawabshah (SBA)", tehsils: ["Nawabshah", "Sakrand", "Daur", "Qazi Ahmed"] },
            { name: "Khairpur", tehsils: ["Khairpur", "Gambat", "Kot Diji", "Sobho Dero", "Kingri", "Thari Mirwah", "Faiz Ganj", "Nara"] },
            { name: "Ghotki", tehsils: ["Ghotki", "Ubauro", "Khanpur", "Mirpur Mathelo", "Daharki"] },
            { name: "Dadu", tehsils: ["Dadu", "Mehar", "Khairpur Nathan Shah", "Johi"] },
            { name: "Badin", tehsils: ["Badin", "Matli", "Tando Bago", "Golarchi", "Talhar"] },
            { name: "Thatta", tehsils: ["Thatta", "Mirpur Sakro", "Keti Bandar", "Ghorabari"] },
            { name: "Sanghar", tehsils: ["Sanghar", "Jam Nawaz Ali", "Khipro", "Shahdadpur", "Sinjhoro", "Tando Adam"] },
            { name: "Naushahro Feroze", tehsils: ["Naushahro Feroze", "Bhiria", "Moro", "Kandiaro", "Mehrabpur"] },
            { name: "Tharparkar", tehsils: ["Mithi", "Islamkot", "Chachro", "Dahli", "Nagarparkar", "Diplo", "Kaloi"] },
            { name: "Umerkot", tehsils: ["Umerkot", "Kunri", "Pithoro", "Samaro"] },
            { name: "Jamshoro", tehsils: ["Kotri", "Sehwan Sharif", "Thano Bula Khan", "Manjhand"] },
            { name: "Matiari", tehsils: ["Matiari", "Hala", "Saeedabad"] },
            { name: "Tando Allahyar", tehsils: ["Tando Allahyar", "Jhando Mari", "Chamber"] },
            { name: "Tando Muhammad Khan", tehsils: ["Tando Muhammad Khan", "Bulri Shah Karim", "Tando Ghulam Hyder"] },
            { name: "Kambar Shahdadkot", tehsils: ["Kambar", "Shahdadkot", "Warah", "Miro Khan", "Nasirabad", "Qubo Saeed Khan", "Sijawal Junejo"] },
            { name: "Kashmore", tehsils: ["Kashmore", "Kandhkot", "Tangwani"] },
            { name: "Shikarpur", tehsils: ["Shikarpur", "Lakhi", "Khanpur", "Garhi Yasin"] },
            { name: "Sujawal", tehsils: ["Sujawal", "Jati", "Shah Bandar", "Mirpur Bathoro", "Banno"] },
            { name: "Jacobabad", tehsils: ["Jacobabad", "Garhi Khairo", "Thul"] }
        ]
    },
    {
        name: "Khyber Pakhtunkhwa",
        districts: [
            { name: "Peshawar", tehsils: ["Peshawar City", "Shah Alam", "Mathra", "Chamkani", "Badaber", "Hayatabad", "Peshawar Cantt"] },
            { name: "Mardan", tehsils: ["Mardan", "Takht Bhai", "Katlang", "Rustam", "Ghari Kapura"] },
            { name: "Swat", tehsils: ["Babuzai", "Matta", "Khwazakhela", "Barikot", "Kabal", "Charbagh", "Behrain"] },
            { name: "Abbottabad", tehsils: ["Abbottabad", "Havelian", "Lora", "Lower Tanawal", "Sherwan"] },
            { name: "Mansehra", tehsils: ["Mansehra", "Balakot", "Oghi", "Baffa Pakhal", "Darband", "Tanawal"] },
            { name: "Nowshera", tehsils: ["Nowshera", "Pabbi", "Jehangira"] },
            { name: "Charsadda", tehsils: ["Charsadda", "Tangi", "Shabqadar"] },
            { name: "Swabi", tehsils: ["Swabi", "Lahor", "Topi", "Razar", "Gadoon"] },
            { name: "Dera Ismail Khan", tehsils: ["D.I. Khan", "Kulachi", "Daraban", "Paroa", "Paharpur", "Ramak"] },
            { name: "Kohat", tehsils: ["Kohat", "Lachi", "Gumbat"] },
            { name: "Haripur", tehsils: ["Haripur", "Ghazi", "Khanpur"] },
            { name: "Bannu", tehsils: ["Bannu", "Domel", "Baka Khel", "Wazir"] },
            { name: "Lakki Marwat", tehsils: ["Lakki Marwat", "Saray Naurang", "Bettani"] },
            { name: "Karak", tehsils: ["Karak", "Banda Daud Shah", "Takht-e-Nasrati"] },
            { name: "Lower Dir", tehsils: ["Timergara", "Adenzai", "Lal Qila", "Samarbagh", "Munda", "Balambat", "Khal"] },
            { name: "Upper Dir", tehsils: ["Dir", "Sharingal", "Bari Kot", "Wari", "Kalkot"] },
            { name: "Buner", tehsils: ["Daggar", "Gadezai", "Mandaran", "Chagharzai", "Chamla", "Khudu Khel"] },
            { name: "Malakand", tehsils: ["Batkhela", "Dargai", "Sam Rani Zai", "Baizai"] },
            { name: "Shangla", tehsils: ["Alpuri", "Puran", "Besham", "Chakesar", "Martung", "Makhuzai", "Shahpur"] },
            { name: "Chitral Lower", tehsils: ["Chitral", "Drosh", "Lot Koh", "Arandu", "Ayuon"] },
            { name: "Chitral Upper", tehsils: ["Mastuj", "Mulkhow", "Torkhow", "Buni"] },
            { name: "Hangu", tehsils: ["Hangu", "Thall"] },
            { name: "Batagram", tehsils: ["Batagram", "Allai"] },
            { name: "Tank", tehsils: ["Tank", "Jandola"] },
            { name: "Kohistan Upper", tehsils: ["Dassu", "Kandia"] },
            { name: "Kohistan Lower", tehsils: ["Pattan", "Palas"] },
            { name: "Kolai Pallas", tehsils: ["Pallas", "Kolai"] },
            { name: "Bajaur", tehsils: ["Khar", "Nawagai", "Barang", "Mamund", "Salarzai", "Utman Khel", "Charmang"] },
            { name: "Mohmand", tehsils: ["Ekka Ghund", "Upper Mohmand", "Lower Mohmand", "Safi", "Pindiali", "Prang Ghar"] },
            { name: "Khyber", tehsils: ["Bara", "Jamrud", "Landi Kotal", "Mulla Gori"] },
            { name: "Kurram", tehsils: ["Upper Kurram", "Lower Kurram", "Central Kurram"] },
            { name: "Orakzai", tehsils: ["Upper Orakzai", "Lower Orakzai", "Central Orakzai", "Ismail Zai"] },
            { name: "North Waziristan", tehsils: ["Miranshah", "Mir Ali", "Razmak", "Datta Khel", "Ghulam Khan", "Spinwam"] },
            { name: "South Waziristan Upper", tehsils: ["Ladha", "Makin", "Sararogha", "Sarwakai", "Tiarza"] },
            { name: "South Waziristan Lower", tehsils: ["Wana", "Birmil", "Toi Khulla"] },
            { name: "Tor Ghar", tehsils: ["Judsona", "Khandar"] }
        ]
    },
    {
        name: "Balochistan",
        districts: [
            { name: "Quetta", tehsils: ["Quetta City", "Quetta Sadar", "Panjpai", "Kuchlak", "Sariab", "Chiltan"] },
            { name: "Gwadar", tehsils: ["Gwadar", "Pasni", "Ormara", "Jiwan", "Suntsar"] },
            { name: "Khuzdar", tehsils: ["Khuzdar", "Nal", "Wadh", "Zehri", "Moola", "Ornach", "Saroona", "Karakh"] },
            { name: "Kech (Turbat)", tehsils: ["Turbat", "Buleda", "Zamuran", "Tump", "Dasht", "Mand", "Hoshab"] },
            { name: "Hub", tehsils: ["Hub", "Winder", "Gaddani", "Sakran", "Dureji"] },
            { name: "Lasbela", tehsils: ["Bela", "Uthal", "Lakhra", "Kanraj", "Liari"] },
            { name: "Pishin", tehsils: ["Pishin", "Hurramzai", "Barshore", "Kanozai", "Saranan", "Nanasaheb"] },
            { name: "Chaman", tehsils: ["Chaman", "City Tehsil"] },
            { name: "Killa Abdullah", tehsils: ["Gulistan", "Dobandi", "Killa Abdullah"] },
            { name: "Zhob", tehsils: ["Zhob", "Sambaza", "Ashwat"] },
            { name: "Loralai", tehsils: ["Loralai", "Bori", "Mekhtar"] },
            { name: "Sibi", tehsils: ["Sibi", "Kutmandai", "Sani", "Lehri"] },
            { name: "Nasirabad", tehsils: ["Dera Murad Jamali", "Tamboo", "Chattar", "Baba Kot", "Mir Hassan"] },
            { name: "Jaffarabad", tehsils: ["Dera Allah Yar", "Jhatpat", "Gandakha"] },
            { name: "Usta Muhammad", tehsils: ["Usta Muhammad", "Gandakha"] },
            { name: "Mastung", tehsils: ["Mastung", "Dasht", "Kardigap", "Khad Kocha"] },
            { name: "Kalat", tehsils: ["Kalat", "Mangochar", "Gazg", "Johan"] },
            { name: "Surab", tehsils: ["Surab"] },
            { name: "Nushki", tehsils: ["Nushki", "Dak"] },
            { name: "Panjgur", tehsils: ["Panjgur", "Gowargo", "Gichk", "Paroom"] },
            { name: "Kharan", tehsils: ["Kharan", "Sar-Kharan", "Tohumulk"] },
            { name: "Awaran", tehsils: ["Awaran", "Mashkay", "Jhal Jhao", "Gishkor", "Korak"] },
            { name: "Washuk", tehsils: ["Washuk", "Besima", "Nag", "Shahgori"] },
            { name: "Dera Bugti", tehsils: ["Dera Bugti", "Sui", "Phelawagh", "Lote", "Pir Koh"] },
            { name: "Kohlu", tehsils: ["Kohlu", "Maiwand", "Kahan", "Grimari"] },
            { name: "Barkhan", tehsils: ["Barkhan"] },
            { name: "Musakhel", tehsils: ["Musakhel", "Kingri", "Drug"] },
            { name: "Sherani", tehsils: ["Sherani"] },
            { name: "Ziarat", tehsils: ["Ziarat", "Sinjawi"] },
            { name: "Harnai", tehsils: ["Harnai", "Shahrig", "Khoast"] },
            { name: "Killa Saifullah", tehsils: ["Killa Saifullah", "Muslim Bagh", "Loiband", "Badini"] },
            { name: "Sohbatpur", tehsils: ["Sohbatpur", "Hayatpur", "Manjhipur"] },
            { name: "Jhal Magsi", tehsils: ["Gandawah", "Jhal Magsi", "Mirpur"] },
            { name: "Kachhi (Bolan)", tehsils: ["Dhadar", "Balanari", "Khattan", "Mach", "Sanni"] },
            { name: "Chagai", tehsils: ["Dalbandin", "Nok Kundi", "Taftan", "Chagai"] },
            { name: "Duki", tehsils: ["Duki"] },
            { name: "Sikandarabad", tehsils: ["Surab"] }
        ]
    },
    {
        name: "Islamabad Capital Territory",
        districts: [
            { name: "Islamabad", tehsils: ["Islamabad City", "Islamabad Rural", "Zone I", "Zone II", "Zone III", "Zone IV", "Zone V", "Bara Kahu", "Tarlai", "Sihala", "Golra", "Nilore"] }
        ]
    },
    {
        name: "Azad Jammu & Kashmir",
        districts: [
            { name: "Muzaffarabad", tehsils: ["Muzaffarabad", "Nasirabad", "Patika", "Garhi Dopatta"] },
            { name: "Mirpur", tehsils: ["Mirpur", "Dadyal", "Chakswari", "Islamgarh"] },
            { name: "Kotli", tehsils: ["Kotli", "Charhoi", "Duliyah Jattan", "Khui Ratta", "Sehnsa", "Nakyal", "Fatehpur Thakiala"] },
            { name: "Bagh", tehsils: ["Bagh", "Dhirkot", "Hari Ghel", "Rehra", "Rara"] },
            { name: "Bhimber", tehsils: ["Bhimber", "Barnala", "Samahni"] },
            { name: "Poonch", tehsils: ["Rawalakot", "Hajira", "Abbaspur", "Thorar"] },
            { name: "Neelum", tehsils: ["Athmuqam", "Sharda"] },
            { name: "Sudhanoti", tehsils: ["Pallandri", "Trarkhal", "Baloch", "Mong"] },
            { name: "Hattian Bala", tehsils: ["Hattian Bala", "Chikar", "Leepa"] },
            { name: "Haveli", tehsils: ["Forward Kahuta", "Khurshidabad"] },
            { name: "Jhelum Valley", tehsils: ["Hattian Bala"] }
        ]
    },
    {
        name: "Gilgit-Baltistan",
        districts: [
            { name: "Gilgit", tehsils: ["Gilgit", "Danyor", "Juglot"] },
            { name: "Skardu", tehsils: ["Skardu", "Gamba", "Gultari"] },
            { name: "Hunza", tehsils: ["Aliabad", "Gojal", "Shimshal"] },
            { name: "Nagar", tehsils: ["Nagar-I", "Nagar-II", "Chalt"] },
            { name: "Diamer", tehsils: ["Chilas", "Babusar", "Darel", "Tangir"] },
            { name: "Astore", tehsils: ["Astore", "Shounter"] },
            { name: "Ghanche", tehsils: ["Khaplu", "Mashabrum", "Daghoni", "Chorbat"] },
            { name: "Ghizer", tehsils: ["Punial", "Ishkoman", "Gupis", "Yasin"] },
            { name: "Kharmang", tehsils: ["Kharmang", "Tolti"] },
            { name: "Shigar", tehsils: ["Shigar"] },
            { name: "Rondu", tehsils: ["Dambudas"] },
            { name: "Gupis-Yasin", tehsils: ["Gupis", "Yasin", "Phander"] },
            { name: "Darel", tehsils: ["Darel"] },
            { name: "Tangir", tehsils: ["Tangir"] }
        ]
    }
];
