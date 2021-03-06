import { Component, Vue, Watch } from 'vue-property-decorator';
import RateList from '@/components/common/RateList';
import MovieFilter from '@/components/common/MovieFilter';
import * as API from '@/api';
import Catch from '@/decorators/Catch';
import { getRange, getMetaInfo } from '@/support/utils';

@Component({
  components: {
    RateList,
    MovieFilter
  }
})
export default class Rate extends Vue {
  get selectedGenreNames() {
    const items = this.genreList;
    const map: any = {};
    items.forEach((item) => {
      map[item.id] = item.name;
    });

    return this.selectedGenres && this.selectedGenres.map((id) => map[id]) || [];
  }

  public genreList: any[] = [];
  public sortOrder: 'releaseDate' | 'title' | 'rating' = null;
  public selectedGenres: number[] = [];
  public selectedYears: number[] = [];
  public movies: any = {
    items: [],
    ratedItems: [],
    count: 0
  };

  public metaInfo(): any {
    return {
      title: `Rate ${this.selectedGenreNames.join(', ') || 'All'} Telugu Movies`,
      ...getMetaInfo({
        url: 'https://statbox.in/browse',
        title: 'StatBox | Telugu Movies Database',
        description: 'A Telugu Movies Database where you can browse, search & rate movies.',
        keywords: [
          'telugu movie database', 'telugu movie', 'database', 'Ratings', 'Movies',
          'Reviews', 'movie ratings', 'movie reviews', 'movies suggestions',
          'good movies', 'movie to watch', 'top movies', 'movie recommendations', 'recommendation engine'
        ],
        image: 'https://storage.googleapis.com/statbox89.appspot.com/images/logos/logo.jpg',
        ldJSON: {
          '@context': 'http://schema.org/',
          '@type': 'Organization',
          'name': 'StatBox',
          'url': 'https://statbox.in',
          'logo': 'https://storage.googleapis.com/statbox89.appspot.com/images/logos/logo.jpg',
          'description': 'A Telugu Movies Database where you can browse, search & rate movies.'
        }
      })
    };
  }

  @Watch('$route.query')
  private onQueryChanged(newVal: any, oldVal: any) {
    const { genre, year, sort } = newVal;
    const isSortEqual = this.sortOrder === sort;
    const isGenresEqual =
      this.selectedGenres.length === genre.length &&
      this.selectedGenres.every((id) => genre && genre.indexOf(id) > -1);
    const isYearsEqual = this.selectedYears && year &&
      this.selectedYears.length === year.length &&
      this.selectedYears.every((id) => year && year.indexOf(id) > -1);

    if (!isSortEqual || !isGenresEqual || !isYearsEqual) {
      this.selectedGenres = (genre && Array.isArray(genre) ? genre : [genre]) || [];
      this.selectedYears = (year && Array.isArray(year) ? year : [year]) || [];
      this.sortOrder = sort;
      this.selectedGenres.sort();
      this.selectedYears.sort();

      this.movies.items = [];
      this.movies.ratedItems = [];
      this.movies.count = 0;
      this.fetchData();
    }
  }

  @Catch
  private mounted() {
    this.sortOrder = this.$route.query.sort as any;
    const genreParams = this.$route.query.genre;

    if (genreParams) {
      if (Array.isArray(genreParams)) {
        this.selectedGenres = genreParams.map((genre) => Number(genre));
      } else {
        this.selectedGenres.push(Number(genreParams));
      }
    }

    this.selectedGenres.sort();
    this.selectedYears.sort();

    this.fetchGenreList();
    this.fetchData();
  }

  @Catch
  private async fetchGenreList() {
    this.genreList = await API.getGenreList();
  }

  @Catch
  private async fetchData() {
    const result = await API.getMoviesByFilter(
      this.selectedGenreNames, this.selectedYears, this.sortOrder, getRange(this.movies)
    );

    this.processResult(result);
  }

  private processResult(result: any) {
    if (result) {
      const items = [...result.items];
      const unrated = items && items.filter((movie: any) => !(movie.userReview && movie.userReview.rating));
      const rated = items && items.filter((movie: any) => (movie.userReview && movie.userReview.rating));

      this.movies.items = this.movies.items.concat(unrated);
      this.movies.ratedItems = this.movies.ratedItems.concat(rated);
      this.movies.count = result.count;
    }
  }
}
