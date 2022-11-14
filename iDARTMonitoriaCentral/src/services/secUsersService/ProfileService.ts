import { useRepo } from 'pinia-orm';
import api from '../apiService/apiService';
import { alert } from '../../components/Shared/Directives/Plugins/Dialog/dialog';
import Profile from 'src/stores/models/secUsers/profile';
import MenuService from './MenuService';
import Menu from 'src/stores/models/secUsers/menu';

const profiles = useRepo(Profile)

export default {
    // Axios API call
    post(params: string , menus :[]) {
      console.log('Params', params);
      return api()
        .post('rpc/manage_profiles', params)
        .then((resp) => {
          console.log(resp.config.data)
          const profileData = JSON.parse(resp.config.data);
          const roleObj = {
            id: profileData.id,
            description: profileData.profile_description,
            active: true,
            menus: menus
          };
          if (params.operation_type_user === 'C') {
            profiles.save(roleObj);
            alert(
              'Sucesso!',
              'O Perfil foi gravado com sucesso',
              null,
              null,
              null
            );
          } else if (params.operation_type_user === 'U') {
            profiles.save(roleObj);
            alert(
              'Sucesso!',
              'O Perfil foi actualizado com sucesso',
              null,
              null,
              null
            );
          } else if (params.operation_type_user === 'I') {
           roleObj.active = params.active_state === false ? false :true;
           console.log(roleObj)
            profiles.save(roleObj);
            alert(
              'Sucesso!',
              'O Perfil foi Inactivado com sucesso',
              null,
              null,
              null
            );
          }
        });
    },
    get(offset: number) {
      if (offset >= 0) {
        return api()
          .get('profiles_vw?offset=' + offset + '&limit=100')
          .then((resp) => {
            console.log(resp.data)
            const keysByProfile = this.groupedMap(resp.data,'description')
            const profilesMap = Array.from(keysByProfile.keys());
            profilesMap.forEach((key) => {
              const profilesMenus =  keysByProfile.get(key)
              console.log(profilesMenus)
              const profile = new Profile()
              profile.description = profilesMenus[0].description
              profile.id = profilesMenus[0].id
              profile.active = profilesMenus[0].active
              console.log(profile)
              profilesMenus.forEach(profileMenu => {
                const menu = MenuService.getFromCode(profileMenu.description_menu)
                profile.menus.push(menu)
              })
              console.log(profile)
              profiles.save(profile);
            });
            offset = offset + 100;
            if (resp.data.length > 0) {
              this.get(offset);
            }
          });
      }
    },
    
    // Local Storage Pinia
    newInstanceEntity() {
      return profiles.getModel().$newInstance();
    },
    getAllProfiles() {
      console.log(profiles.withAll().get())
      return profiles.withAll().get();
    },

    getFromDescription(description: string) {
      return profiles.query().where('description', description).first();
    },
    getWhereInDescription (descriptions: any[]) {
      return profiles.query().withAll().whereIn('description', descriptions).get();
    },

    groupedMap(items, key) {
    return  items.reduce(
        (entryMap, e) => entryMap.set(e[key], [...(entryMap.get(e[key]) || []), e]),
        new Map()
      );
    }
  };
  